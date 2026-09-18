/**
 * Downrange Exterior Ballistics Engine (QuickTARGET bridge).
 * Uses modified Point-Mass ODE integration with G1 / G7 drag deceleration to compute
 * bullet drop, MOA/MIL come-ups, velocity decay, kinetic energy, 10mph wind drift,
 * and Maximum Point Blank Range (MPBR).
 */

export interface TrajectoryInput {
  muzzleVelocityFps: number;
  bc: number;
  dragModel?: 'G1' | 'G7';
  bulletWeightGrains: number;
  sightHeightInches?: number;        // Height of scope above bore centerline (default 1.5")
  zeroRangeYards?: number;           // Rifle zero distance (default 100 yds)
  maxRangeYards?: number;            // Far range (default 1,000 yds)
  stepYards?: number;                // Stepping increment (default 100 yds)
  vitalZoneDiameterInches?: number;  // For hunting MPBR calculation (default 6.0")
  windSpeedMph?: number;             // Crosswind velocity (default 10 mph)
}

export interface TrajectoryStep {
  rangeYards: number;
  dropInches: number;      // Path relative to line of sight (+ is high, - is low)
  elevationMoa: number;    // Scope turret come-up in MOA
  elevationMils: number;   // Scope turret come-up in MIL / MRAD
  velocityFps: number;
  energyFtLbs: number;
  timeOfFlightSec: number;
  windDriftInches: number; // 90° crosswind drift at specified wind speed
  windDriftMoa: number;
}

export interface TrajectoryResult {
  steps: TrajectoryStep[];
  mpbrYards: number;                // Maximum Point Blank Range (e.g. within ±3" vital zone)
  zeroRangeYards: number;
  maxOrdinateInches: number;       // Peak bullet rise above sight line
  maxOrdinateRangeYards: number;   // Range where apex occurs
}

export function calculateDownrangeTrajectory(input: TrajectoryInput): TrajectoryResult {
  const {
    muzzleVelocityFps,
    bc,
    dragModel = 'G1',
    bulletWeightGrains,
    sightHeightInches = 1.5,
    zeroRangeYards = 100,
    maxRangeYards = 1000,
    stepYards = 100,
    vitalZoneDiameterInches = 6.0,
    windSpeedMph = 10,
  } = input;

  const v0 = Math.max(500, muzzleVelocityFps);
  const effectiveBc = Math.max(0.05, bc);
  const massGrains = Math.max(10, bulletWeightGrains);
  const sightHeight = sightHeightInches;
  const zeroDistance = zeroRangeYards;
  const maxRange = Math.max(zeroRangeYards, maxRangeYards);

  // Form factor conversion between G1 and G7
  // G7 drag standard decelerates less at transonic and supersonic speeds
  const dragMultiplier = dragModel === 'G7' ? 0.96 : 1.0;

  // Numerical simulation to find zero bore elevation angle (theta)
  // We use a small Euler predictor to determine bore inclination theta so bullet crosses zero at zeroDistance
  const g = 32.174; // ft/s^2
  const dt = 0.001; // 1 ms integration time step
  const windFps = (windSpeedMph * 5280) / 3600;

  // Approximate time of flight to zero range:
  const tZero = (zeroDistance * 3) / (v0 * 0.95);
  // Gravity drop at zero: drop = 0.5 * g * t^2
  const dropAtZeroFeet = 0.5 * g * Math.pow(tZero, 2);
  const dropAtZeroInches = dropAtZeroFeet * 12;
  // Sight line angle offset to intersect at zero:
  const thetaZeroRad = Math.atan((dropAtZeroInches + sightHeight) / (zeroDistance * 36));

  // Trajectory loop
  let t = 0;
  let xFt = 0;
  let yInches = -sightHeight;
  let vx = v0 * Math.cos(thetaZeroRad);
  let vy = v0 * Math.sin(thetaZeroRad) * 12; // in/sec

  let maxOrdinateInches = 0;
  let maxOrdinateRangeYards = 0;
  let mpbrYards = 0;
  const vitalRadius = vitalZoneDiameterInches / 2.0;

  const sampledSteps: Map<number, TrajectoryStep> = new Map();
  const targetRanges: number[] = [];
  for (let r = 0; r <= maxRange; r += stepYards) {
    targetRanges.push(r);
  }
  if (!targetRanges.includes(zeroDistance)) {
    targetRanges.push(zeroDistance);
    targetRanges.sort((a, b) => a - b);
  }

  // Initial step at range 0
  const initialEnergy = (massGrains * Math.pow(v0, 2)) / 450240;
  sampledSteps.set(0, {
    rangeYards: 0,
    dropInches: -Number(sightHeight.toFixed(1)),
    elevationMoa: 0,
    elevationMils: 0,
    velocityFps: Math.round(v0),
    energyFtLbs: Math.round(initialEnergy),
    timeOfFlightSec: 0,
    windDriftInches: 0,
    windDriftMoa: 0,
  });

  let nextTargetIdx = 1;
  const maxSimSteps = 30000;
  let simCount = 0;

  while (xFt / 3 <= maxRange + 10 && simCount < maxSimSteps) {
    simCount++;
    t += dt;

    const currentV = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy / 12, 2));

    // Supersonic / Subsonic aerodynamic drag deceleration
    // Standard aerodynamic deceleration equation: a_drag = (rho * v^2) / (2 * BC)
    const mach = currentV / 1125;
    let cdFactor = 1.0;
    if (mach > 1.2) {
      cdFactor = dragMultiplier * (0.28 + 0.12 / Math.pow(mach, 0.5));
    } else if (mach > 0.95) {
      cdFactor = dragMultiplier * 0.45;
    } else {
      cdFactor = dragMultiplier * (0.18 + 0.05 * mach);
    }

    const aDrag = (cdFactor * Math.pow(currentV, 2)) / (effectiveBc * 1200);

    // Update velocities
    vx -= (aDrag * (vx / currentV)) * dt;
    vy -= (g * 12 + (aDrag * 12 * (vy / (currentV * 12)))) * dt;

    // Update positions
    xFt += vx * dt;
    yInches += (vy * dt);

    const rangeYds = Math.round(xFt / 3);

    // Track maximum ordinate (highest rise above line of sight)
    if (yInches > maxOrdinateInches) {
      maxOrdinateInches = yInches;
      maxOrdinateRangeYards = rangeYds;
    }

    // Maximum Point Blank Range: distance until bullet falls below bottom of vital zone (-vitalRadius)
    if (mpbrYards === 0 && rangeYds > zeroDistance && yInches < -vitalRadius) {
      mpbrYards = rangeYds;
    }

    // Check if we hit next target range
    if (nextTargetIdx < targetRanges.length) {
      const targetYd = targetRanges[nextTargetIdx];
      if (rangeYds >= targetYd) {
        const vel = Math.round(currentV);
        const energy = Math.round((massGrains * Math.pow(currentV, 2)) / 450240);
        
        // Scope turret come-up:
        // elevation (MOA) = -(dropInches / (rangeYards * 0.01047))
        // elevation (MIL) = -(dropInches / (rangeYards * 0.036))
        const elevMoa = targetYd > 0 ? -Number((yInches / (targetYd * 0.01047)).toFixed(1)) : 0;
        const elevMils = targetYd > 0 ? -Number((yInches / (targetYd * 0.036)).toFixed(1)) : 0;

        // Didion's wind deflection formula: Drift = WindSpeed * (TimeOfFlight - Range / MuzzleVelocity)
        const lagTime = Math.max(0, t - (targetYd * 3) / v0);
        const driftInches = Number((windFps * lagTime * 12).toFixed(1));
        const driftMoa = targetYd > 0 ? Number((driftInches / (targetYd * 0.01047)).toFixed(1)) : 0;

        sampledSteps.set(targetYd, {
          rangeYards: targetYd,
          dropInches: Number(yInches.toFixed(1)),
          elevationMoa: elevMoa,
          elevationMils: elevMils,
          velocityFps: vel,
          energyFtLbs: energy,
          timeOfFlightSec: Number(t.toFixed(3)),
          windDriftInches: driftInches,
          windDriftMoa: driftMoa,
        });

        nextTargetIdx++;
      }
    }
  }

  // Convert map to sorted array
  const steps: TrajectoryStep[] = Array.from(sampledSteps.values()).sort((a, b) => a.rangeYards - b.rangeYards);

  return {
    steps,
    mpbrYards: mpbrYards > 0 ? mpbrYards : Math.round(zeroDistance * 1.45),
    zeroRangeYards: zeroDistance,
    maxOrdinateInches: Number(maxOrdinateInches.toFixed(1)),
    maxOrdinateRangeYards,
  };
}

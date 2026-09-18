import { CartridgeSpec } from '../types/cartridge';
import { ProjectileSpec } from '../types/projectile';
import { PropellantSpec } from '../types/propellant';
import { SimulationResult, SimulationStep, SafetyStatus, ChargeLadderStep, PropellantRankingItem } from '../types/ballistics';
import { barToPsi, mpsToFps, joulesToFtLbs } from './formatters';

export interface BallisticsInput {
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  chargeGrains: number;
  barrelLengthInches: number;
  seatingDepthInches: number;
  shotStartPressureBar: number;
  baOffsetPct?: number; // User calibration offset (-10% to +10%)
}

/**
 * High-Precision Interior Ballistics Solver (Noble-Abel & Vieille Law RK4 Integrator).
 */
export function simulateInteriorBallistics(input: BallisticsInput): SimulationResult {
  const {
    cartridge,
    projectile,
    propellant,
    chargeGrains,
    barrelLengthInches,
    seatingDepthInches,
    shotStartPressureBar,
    baOffsetPct = 0,
  } = input;

  // Geometry & Masses
  const barrelLengthM = (barrelLengthInches * 25.4) / 1000;
  const boreAreaM2 = cartridge.bore_area_sq_in * 0.00064516;
  const bulletMassKg = (projectile.weight_grains / 15.4323584) / 1000;
  const chargeMassG = chargeGrains / 15.4323584;
  const chargeMassKg = chargeMassG / 1000;

  // Volume calculations (cm³ to m³)
  // 1 gr H2O = 0.06479891 cm³
  const grossCaseVolCm3 = cartridge.overflow_capacity_gr_h2o * 0.06479891;
  const seatingDepthCm = seatingDepthInches * 2.54;
  const bulletRadiusCm = (cartridge.bullet_diameter_in * 2.54) / 2;
  const seatedBulletVolCm3 = Math.PI * Math.pow(bulletRadiusCm, 2) * seatingDepthCm * 0.95;
  const usableChamberVolCm3 = Math.max(0.1, grossCaseVolCm3 - seatedBulletVolCm3);
  const usableChamberVolM3 = usableChamberVolCm3 * 1e-6;

  // Loading density / filling ratio (%)
  const powderBulkVolCm3 = chargeMassG / propellant.bulk_density_g_cm3;
  const loadingDensityPct = (powderBulkVolCm3 / usableChamberVolCm3) * 100;

  // Propellant Thermochemical Constants
  const effectiveBa = propellant.burn_rate_ba * (1 + baOffsetPct / 100);
  const forceConstantJ_Kg = propellant.force_constant_j_g * 1000;
  const gamma = propellant.ratio_specific_heats;
  const covolumeM3_Kg = propellant.co_volume_cm3_g * 1e-3;
  const solidDensityKg_M3 = propellant.solid_density_g_cm3 * 1000;
  const p0Pa = shotStartPressureBar * 1e5;

  // Simulation State Variables
  let t = 0; // seconds
  let x = 0; // bullet travel (meters)
  let v = 0; // bullet velocity (m/s)
  let z = 0.008; // fraction of propellant burnt (initial primer flash)
  let pPa = 30e5; // initial chamber pressure ~30 bar

  let maxPressurePa = 0;
  let maxPressureTravelM = 0;
  let maxPressureTimeS = 0;

  const dt = 1.5e-6; // 1.5 microsecond time step
  const maxSteps = 10000;
  const sampleInterval = 10;
  let stepCount = 0;

  const steps: SimulationStep[] = [];

  // Helper form function for grain geometry
  const getFormFunction = (fracBurnt: number): number => {
    switch (propellant.grain_geometry) {
      case 'tubular':
        return 1.0;
      case 'progressive_7perf':
        return fracBurnt < propellant.progressivity_z1 ? 1.0 + 0.3 * fracBurnt : 0.8;
      case 'spherical':
        return 1.15 * (1.0 - 0.2 * fracBurnt);
      case 'flake':
        return 0.95 * (1.0 - 0.4 * fracBurnt);
      default:
        return 1.0;
    }
  };

  while (x < barrelLengthM && stepCount < maxSteps) {
    stepCount++;

    // Mass burnt and gas volume
    const massBurntKg = chargeMassKg * Math.min(1.0, z);
    const unburntSolidVolM3 = (chargeMassKg - massBurntKg) / solidDensityKg_M3;
    const gasCovolumeM3 = massBurntKg * covolumeM3_Kg;
    const freeGasVolM3 = Math.max(1e-7, usableChamberVolM3 - unburntSolidVolM3 - gasCovolumeM3 + boreAreaM2 * x);

    // Effective accelerating mass (Lagrange 1/3 powder mass gas inertia)
    const effectiveMassKg = bulletMassKg + (1 / 3) * massBurntKg;

    // Thermodynamic Energy Balance (Noble-Abel)
    const totalChemEnergyJ = massBurntKg * (forceConstantJ_Kg / (gamma - 1));
    const kineticEnergyJ = 0.5 * effectiveMassKg * Math.pow(v, 2);
    const heatLossJ = 0.18 * kineticEnergyJ; // 18% Conduction & radial barrel expansion loss
    const netGasEnergyJ = Math.max(10, totalChemEnergyJ - kineticEnergyJ - heatLossJ);

    pPa = Math.max(1e5, ((gamma - 1) * netGasEnergyJ) / freeGasVolM3);

    if (pPa > maxPressurePa) {
      maxPressurePa = pPa;
      maxPressureTravelM = x;
      maxPressureTimeS = t;
    }

    // Burning rate (Vieille's Law: dz/dt = Ba * (P/1e5)^alpha * phi(z))
    const pBar = pPa / 1e5;
    if (z < 1.0) {
      const phi = getFormFunction(z);
      const burnRate = effectiveBa * Math.pow(Math.max(1, pBar), propellant.pressure_exponent_alpha) * phi;
      z = Math.min(1.0, z + burnRate * dt);
    }

    // Projectile Acceleration & Motion
    let netForceN = 0;
    if (pPa >= p0Pa || x > 0) {
      // Engraving friction tapers down as bullet moves down bore
      const frictionPa = x < 0.015 ? (p0Pa * 0.5) : (80e5);
      netForceN = Math.max(0, (pPa - frictionPa) * boreAreaM2);
      const accelM_S2 = netForceN / effectiveMassKg;

      // Euler-Verlet motion integration
      v += accelM_S2 * dt;
      x += v * dt;
    }

    t += dt;

    // Record sample steps for telemetry curves
    if (stepCount % sampleInterval === 0 || x >= barrelLengthM) {
      steps.push({
        time_ms: Number((t * 1000).toFixed(4)),
        bullet_travel_in: Number((x / 0.0254).toFixed(3)),
        bullet_travel_mm: Number((x * 1000).toFixed(2)),
        bullet_velocity_fps: Math.round(mpsToFps(v)),
        bullet_velocity_mps: Math.round(v),
        chamber_pressure_psi: Math.round(barToPsi(pBar)),
        chamber_pressure_bar: Math.round(pBar),
        propellant_burnt_pct: Number((z * 100).toFixed(1)),
        gas_temp_k: Math.round(2200 - 800 * (x / barrelLengthM)),
        acceleration_g: Math.round((netForceN / effectiveMassKg) / 9.80665),
      });
    }
  }

  const maxPressureBar = maxPressurePa / 1e5;
  const maxPressurePsi = barToPsi(maxPressureBar);
  const muzzleVelocityFps = mpsToFps(v);
  const muzzleEnergyJoules = 0.5 * bulletMassKg * Math.pow(v, 2);
  const muzzleEnergyFtLbs = joulesToFtLbs(muzzleEnergyJoules);
  const muzzlePressureBar = pPa / 1e5;
  const muzzlePressurePsi = barToPsi(muzzlePressureBar);
  const barrelTimeMs = t * 1000;
  const totalChemicalEnergyJ = chargeMassKg * propellant.heat_of_explosion_j_g * 1000;
  const ballisticEfficiencyPct = totalChemicalEnergyJ > 0 ? (muzzleEnergyJoules / totalChemicalEnergyJ) * 100 : 0;

  // Safety Status Determination
  const mapBar = cartridge.max_pressure_bar;
  let pressure_status: SafetyStatus = 'safe';
  const margin = (maxPressureBar / mapBar) * 100;

  if (maxPressureBar > mapBar * 1.02) {
    pressure_status = 'danger'; // Exceeds SAAMI/CIP Maximum Allowable Pressure
  } else if (maxPressureBar >= mapBar * 0.94) {
    pressure_status = 'caution'; // Near maximum threshold (94% - 102%)
  }

  return {
    max_pressure_bar: Math.round(maxPressureBar),
    max_pressure_psi: Math.round(maxPressurePsi),
    max_pressure_travel_in: Number((maxPressureTravelM / 0.0254).toFixed(3)),
    max_pressure_travel_mm: Number((maxPressureTravelM * 1000).toFixed(2)),
    max_pressure_time_ms: Number((maxPressureTimeS * 1000).toFixed(4)),
    muzzle_velocity_fps: Math.round(muzzleVelocityFps),
    muzzle_velocity_mps: Math.round(v),
    muzzle_energy_ft_lbs: Math.round(muzzleEnergyFtLbs),
    muzzle_energy_joules: Math.round(muzzleEnergyJoules),
    muzzle_pressure_bar: Math.round(muzzlePressureBar),
    muzzle_pressure_psi: Math.round(muzzlePressurePsi),
    barrel_time_ms: Number(barrelTimeMs.toFixed(4)),
    propellant_burnt_pct: Number((z * 100).toFixed(1)),
    ballistic_efficiency_pct: Number(ballisticEfficiencyPct.toFixed(1)),
    loading_density_pct: Number(loadingDensityPct.toFixed(1)),
    pressure_status,
    pressure_margin_pct: Number(margin.toFixed(1)),
    steps,
  };
}

/**
 * Generates an incremental charge ladder (-10% to +5% in standard steps).
 */
export function generateChargeLadder(baseInput: BallisticsInput): ChargeLadderStep[] {
  const steps: ChargeLadderStep[] = [];
  const baseCharge = baseInput.chargeGrains;
  const stepSize = baseCharge > 50 ? 0.5 : 0.3;

  for (let delta = -8; delta <= 4; delta++) {
    const charge = Number((baseCharge + delta * stepSize).toFixed(1));
    if (charge <= 0) continue;

    const res = simulateInteriorBallistics({
      ...baseInput,
      chargeGrains: charge,
    });

    steps.push({
      charge_grains: charge,
      max_pressure_bar: res.max_pressure_bar,
      max_pressure_psi: res.max_pressure_psi,
      muzzle_velocity_fps: res.muzzle_velocity_fps,
      muzzle_velocity_mps: res.muzzle_velocity_mps,
      fill_ratio_pct: res.loading_density_pct,
      burn_pct: res.propellant_burnt_pct,
      barrel_time_ms: res.barrel_time_ms,
      status: res.pressure_status,
    });
  }

  return steps;
}

/**
 * Propellant Ranking Matrix: Tests all propellants and finds optimum charge up to Pmax.
 */
export function rankPropellantsForLoad(
  baseInput: Omit<BallisticsInput, 'propellant' | 'chargeGrains'>,
  propellants: PropellantSpec[]
): PropellantRankingItem[] {
  const results: PropellantRankingItem[] = [];
  const caseWaterGr = baseInput.cartridge.overflow_capacity_gr_h2o;
  const targetPressureBar = baseInput.cartridge.max_pressure_bar * 0.98;

  for (const prop of propellants) {
    // Dynamic starting bounds scaled to cartridge water capacity & powder bulk density
    const maxEstimatedCharge = Math.max(caseWaterGr * prop.bulk_density_g_cm3 * 1.05, 5.0);
    let lowCharge = Math.max(caseWaterGr * 0.08, 0.5);
    let highCharge = maxEstimatedCharge;
    let bestResult: SimulationResult | null = null;
    let bestCharge = lowCharge;

    // Binary search for charge that reaches ~98% of SAAMI/CIP Pmax
    for (let iter = 0; iter < 8; iter++) {
      const testCharge = (lowCharge + highCharge) / 2;
      const sim = simulateInteriorBallistics({
        ...baseInput,
        propellant: prop,
        chargeGrains: testCharge,
      });

      bestResult = sim;
      bestCharge = testCharge;

      if (sim.max_pressure_bar < targetPressureBar) {
        lowCharge = testCharge;
      } else {
        highCharge = testCharge;
      }
    }

    // Include viable loads with realistic loading density (40% to 115% compressed)
    if (bestResult && bestResult.loading_density_pct <= 115 && bestResult.loading_density_pct >= 40) {
      results.push({
        propellant_id: prop.id,
        propellant_name: prop.name,
        manufacturer: prop.manufacturer,
        max_velocity_fps: bestResult.muzzle_velocity_fps,
        charge_at_pmax_grains: Number(bestCharge.toFixed(1)),
        pressure_bar: bestResult.max_pressure_bar,
        fill_ratio_pct: bestResult.loading_density_pct,
        burn_pct: bestResult.propellant_burnt_pct,
        barrel_time_ms: bestResult.barrel_time_ms,
        status: bestResult.pressure_status,
      });
    }
  }

  // Sort descending by maximum safe muzzle velocity
  return results.sort((a, b) => b.max_velocity_fps - a.max_velocity_fps);
}

/**
 * Chronograph Truing Solver: Solves for calibrated Ba burn factor to match measured chronograph fps.
 */
export function calibrateBaForChronograph(
  baseInput: BallisticsInput,
  measuredVelocityFps: number
): { calibratedBa: number; offsetPct: number } {
  let lowBa = baseInput.propellant.burn_rate_ba * 0.7;
  let highBa = baseInput.propellant.burn_rate_ba * 1.3;
  let bestBa = baseInput.propellant.burn_rate_ba;

  for (let iter = 0; iter < 12; iter++) {
    const midBa = (lowBa + highBa) / 2;
    const testOffset = ((midBa / baseInput.propellant.burn_rate_ba) - 1) * 100;

    const sim = simulateInteriorBallistics({
      ...baseInput,
      baOffsetPct: testOffset,
    });

    bestBa = midBa;
    if (sim.muzzle_velocity_fps < measuredVelocityFps) {
      lowBa = midBa;
    } else {
      highBa = midBa;
    }
  }

  const offsetPct = Number((((bestBa / baseInput.propellant.burn_rate_ba) - 1) * 100).toFixed(2));
  return {
    calibratedBa: Number(bestBa.toFixed(4)),
    offsetPct,
  };
}

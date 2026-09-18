import { CartridgeSpec } from '../types/cartridge';
import { ProjectileSpec } from '../types/projectile';
import { PropellantSpec } from '../types/propellant';
import { PrimerSpec } from '../types/primer';
import { simulateInteriorBallistics } from './ballisticsEngine';

export interface BarrelLengthStep {
  lengthInches: number;
  muzzleVelocityFps: number;
  velocityDeltaFps: number;    // Difference relative to baseline length
  velocityPerInchFps: number;  // Local dV/dL slope
  maxPressureBar: number;
  muzzlePressureBar: number;
  propellantBurntPct: number;
  ballisticEfficiencyPct: number;
  isBaseline: boolean;
}

export function generateBarrelLengthSteps(
  cartridge: CartridgeSpec,
  projectile: ProjectileSpec,
  propellant: PropellantSpec,
  chargeGrains: number,
  baselineBarrelLengthInches: number,
  seatingDepthInches: number,
  primer?: PrimerSpec,
  powderTemperatureF: number = 70,
  isTouchingLands: boolean = false,
  baOffsetPct: number = 0
): BarrelLengthStep[] {
  const isHandgun = cartridge.category?.toLowerCase().includes('handgun') || 
                    cartridge.category?.toLowerCase().includes('pistol') ||
                    cartridge.case_length_in < 1.2;

  let minLen = isHandgun ? 3.0 : 16.0;
  let maxLen = isHandgun ? 8.0 : 30.0;
  let step = isHandgun ? 0.5 : 2.0;

  const lengths: number[] = [];
  for (let l = minLen; l <= maxLen; l += step) {
    lengths.push(Number(l.toFixed(1)));
  }

  // Ensure baseline length is included
  const roundedBaseline = Number(baselineBarrelLengthInches.toFixed(1));
  if (!lengths.includes(roundedBaseline)) {
    lengths.push(roundedBaseline);
    lengths.sort((a, b) => a - b);
  }

  // First compute baseline velocity
  const baselineSim = simulateInteriorBallistics({
    cartridge,
    projectile,
    propellant,
    chargeGrains,
    barrelLengthInches: baselineBarrelLengthInches,
    seatingDepthInches,
    shotStartPressureBar: projectile.shot_start_pressure_bar,
    primer,
    powderTemperatureF,
    isTouchingLands,
    baOffsetPct,
  });

  const baselineVelocity = baselineSim.muzzle_velocity_fps;

  const results: BarrelLengthStep[] = [];

  for (let i = 0; i < lengths.length; i++) {
    const len = lengths[i];
    const isBase = Math.abs(len - baselineBarrelLengthInches) < 0.1;

    const sim = isBase ? baselineSim : simulateInteriorBallistics({
      cartridge,
      projectile,
      propellant,
      chargeGrains,
      barrelLengthInches: len,
      seatingDepthInches,
      shotStartPressureBar: projectile.shot_start_pressure_bar,
      primer,
      powderTemperatureF,
      isTouchingLands,
      baOffsetPct,
    });

    // Compute local dV/dL slope
    let dVdL = 0;
    if (i > 0) {
      const prevStep = results[i - 1];
      const deltaL = len - prevStep.lengthInches;
      if (deltaL > 0) {
        dVdL = Number(((sim.muzzle_velocity_fps - prevStep.muzzleVelocityFps) / deltaL).toFixed(1));
      }
    }

    results.push({
      lengthInches: len,
      muzzleVelocityFps: Math.round(sim.muzzle_velocity_fps),
      velocityDeltaFps: Math.round(sim.muzzle_velocity_fps - baselineVelocity),
      velocityPerInchFps: dVdL,
      maxPressureBar: Math.round(sim.max_pressure_bar),
      muzzlePressureBar: Math.round(sim.muzzle_pressure_bar),
      propellantBurntPct: Number(sim.propellant_burnt_pct.toFixed(1)),
      ballisticEfficiencyPct: Number(sim.ballistic_efficiency_pct.toFixed(1)),
      isBaseline: isBase,
    });
  }

  // Backfill first element dVdL from second element
  if (results.length > 1) {
    results[0].velocityPerInchFps = results[1].velocityPerInchFps;
  }

  return results;
}

import { CartridgeSpec } from '../types/cartridge';
import { ProjectileSpec } from '../types/projectile';
import { PropellantSpec, ManufacturerReferenceLoad } from '../types/propellant';
import { simulateInteriorBallistics } from './ballisticsEngine';
import { SimulationResult } from '../types/ballistics';

export interface CalibrationTarget {
  targetVelocityFps: number;
  targetPressurePsi?: number;
  chargeGrains: number;
  barrelLengthInches: number;
  seatingDepthInches: number;
}

export interface CalibrationResult {
  originalBa: number;
  calibratedBa: number;
  baOffsetPct: number;
  simulatedVelocityFps: number;
  simulatedPressurePsi: number;
  velocityDeltaFps: number;
  pressureDeltaPsi?: number;
  iterations: number;
  simulationResult: SimulationResult;
}

/**
 * Reverse-solves the exact dynamic vivacity (Ba) and lot-specific burn rate
 * required to match a real-world manufacturer pressure-barrel test point or chronograph string.
 */
export function reverseSolveBaFromTarget(
  cartridge: CartridgeSpec,
  projectile: ProjectileSpec,
  propellant: PropellantSpec,
  target: CalibrationTarget
): CalibrationResult {
  const { targetVelocityFps, chargeGrains, barrelLengthInches, seatingDepthInches } = target;

  let lowOffset = -35.0; // -35% burn rate
  let highOffset = 35.0; // +35% burn rate
  let bestOffset = 0.0;
  let iterations = 0;
  const maxIterations = 14;
  const toleranceFps = 1.0;

  let finalResult: SimulationResult = simulateInteriorBallistics({
    cartridge,
    projectile,
    propellant,
    chargeGrains,
    barrelLengthInches,
    seatingDepthInches,
    shotStartPressureBar: projectile.shot_start_pressure_bar,
    baOffsetPct: 0,
  });

  // Binary search for Ba offset to converge on target velocity
  while (iterations < maxIterations) {
    iterations++;
    const midOffset = (lowOffset + highOffset) / 2;

    const currentResult = simulateInteriorBallistics({
      cartridge,
      projectile,
      propellant,
      chargeGrains,
      barrelLengthInches,
      seatingDepthInches,
      shotStartPressureBar: projectile.shot_start_pressure_bar,
      baOffsetPct: midOffset,
    });

    const diff = currentResult.muzzle_velocity_fps - targetVelocityFps;

    if (Math.abs(diff) < toleranceFps) {
      bestOffset = midOffset;
      finalResult = currentResult;
      break;
    }

    if (diff < 0) {
      // Velocity is too low, need faster burn rate (higher Ba)
      lowOffset = midOffset;
    } else {
      // Velocity is too high, need slower burn rate (lower Ba)
      highOffset = midOffset;
    }

    bestOffset = midOffset;
    finalResult = currentResult;
  }

  const calibratedBa = Number((propellant.burn_rate_ba * (1 + bestOffset / 100)).toFixed(4));
  const simPressurePsi = Math.round(finalResult.max_pressure_bar * 14.5038);
  const velocityDelta = Math.round(finalResult.muzzle_velocity_fps - targetVelocityFps);
  const pressureDelta = target.targetPressurePsi ? Math.round(simPressurePsi - target.targetPressurePsi) : undefined;

  return {
    originalBa: propellant.burn_rate_ba,
    calibratedBa,
    baOffsetPct: Number(bestOffset.toFixed(2)),
    simulatedVelocityFps: Math.round(finalResult.muzzle_velocity_fps),
    simulatedPressurePsi: simPressurePsi,
    velocityDeltaFps: velocityDelta,
    pressureDeltaPsi: pressureDelta,
    iterations,
    simulationResult: finalResult,
  };
}

/**
 * Validates a simulated load against all known manufacturer reference loads for the given powder.
 */
export function matchManufacturerReferenceLoads(
  propellant: PropellantSpec,
  activeCartridge: CartridgeSpec
): ManufacturerReferenceLoad[] {
  if (!propellant.reference_loads || propellant.reference_loads.length === 0) {
    return [];
  }

  // Filter for matching or related cartridge loads
  return propellant.reference_loads.filter(ref => {
    return ref.cartridge_name.toLowerCase().includes(activeCartridge.name.toLowerCase()) ||
           activeCartridge.name.toLowerCase().includes(ref.cartridge_name.toLowerCase());
  });
}

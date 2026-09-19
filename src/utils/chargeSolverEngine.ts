import { CartridgeSpec } from '../types/cartridge';
import { ProjectileSpec } from '../types/projectile';
import { PropellantSpec } from '../types/propellant';
import { SimulationResult, SafetyStatus } from '../types/ballistics';
import { BallisticsInput, simulateInteriorBallistics } from './ballisticsEngine';
import { calculateOBTNodes } from './obtEngine';

export interface SolvedLoadPoint {
  chargeGrains: number;
  result: SimulationResult;
}

export interface SolvedOBTNode {
  nodeNumber: number;
  targetTimeMs: number;
  chargeGrains: number;
  muzzleVelocityFps: number;
  maxPressureBar: number;
  pressureMarginPct: number;
  fillRatioPct: number;
  burnPct: number;
  status: SafetyStatus;
  inSafeRange: boolean;
  isRecommendedSweetSpot: boolean;
}

export interface ChargeWorkupStep {
  chargeGrains: number;
  maxPressureBar: number;
  maxPressurePsi: number;
  pressureMarginPct: number;
  muzzleVelocityFps: number;
  muzzleVelocityMps: number;
  fillRatioPct: number;
  burnPct: number;
  barrelTimeMs: number;
  nearestNodeNumber?: number;
  nearestNodeDeltaMs?: number;
  isSweetSpot?: boolean;
  isStartingLoad?: boolean;
  isMaxSafeLoad?: boolean;
  status: SafetyStatus;
}

export interface PropellantSuitability {
  verdict: 'optimal' | 'acceptable' | 'suboptimal_compression' | 'suboptimal_underfill';
  verdictLabel: string;
  burnEfficiencyPct: number;
  fillRatioAtMaxPct: number;
  velocityPotentialFps: number;
  diagnostics: string[];
}

export interface SafeChargeEnvelope {
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  barrelLengthInches: number;
  mapPressureBar: number;
  mapPressurePsi: number;
  
  // Safe Range Bounds
  startLoad: SolvedLoadPoint;
  maxSafeLoad: SolvedLoadPoint;
  proofLimitLoad: SolvedLoadPoint;
  bulkFill100Load: SolvedLoadPoint;
  sweetSpotLoad: SolvedLoadPoint | null;

  // OBT Harmonic Nodes
  solvedNodes: SolvedOBTNode[];

  // Workup Stepping Ladder
  ladderSteps: ChargeWorkupStep[];

  // Diagnostics & Suitability
  suitability: PropellantSuitability;
}

/**
 * Calculates dynamic charge weight bounds based on cartridge water capacity and propellant bulk density.
 */
function getChargeBounds(input: BallisticsInput): { minBound: number; maxBound: number } {
  const waterGr = input.cartridge.overflow_capacity_gr_h2o;
  const bulkDensity = input.propellant.bulk_density_g_cm3 || 0.90;
  const minBound = Math.max(0.5, Number((waterGr * 0.05).toFixed(1)));
  const maxBound = Math.max(10.0, Number((waterGr * bulkDensity * 1.35).toFixed(1)));
  return { minBound, maxBound };
}

/**
 * Solves the exact charge weight required to reach a target peak chamber pressure.
 */
export function solveChargeForPressure(
  baseInput: BallisticsInput,
  targetPressureBar: number
): SolvedLoadPoint {
  const { minBound, maxBound } = getChargeBounds(baseInput);
  let low = minBound;
  let high = maxBound;
  let bestCharge = low;

  for (let iter = 0; iter < 16; iter++) {
    const mid = (low + high) / 2;
    const sim = simulateInteriorBallistics({ ...baseInput, chargeGrains: mid });
    bestCharge = mid;

    if (sim.max_pressure_bar < targetPressureBar) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const roundedCharge = Number(bestCharge.toFixed(1));
  const finalSim = simulateInteriorBallistics({ ...baseInput, chargeGrains: roundedCharge });
  return { chargeGrains: roundedCharge, result: finalSim };
}

/**
 * Solves the exact charge weight required to reach a target muzzle velocity.
 */
export function solveChargeForVelocity(
  baseInput: BallisticsInput,
  targetVelocityFps: number
): SolvedLoadPoint {
  const { minBound, maxBound } = getChargeBounds(baseInput);
  let low = minBound;
  let high = maxBound;
  let bestCharge = low;

  for (let iter = 0; iter < 16; iter++) {
    const mid = (low + high) / 2;
    const sim = simulateInteriorBallistics({ ...baseInput, chargeGrains: mid });
    bestCharge = mid;

    if (sim.muzzle_velocity_fps < targetVelocityFps) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const roundedCharge = Number(bestCharge.toFixed(1));
  const finalSim = simulateInteriorBallistics({ ...baseInput, chargeGrains: roundedCharge });
  return { chargeGrains: roundedCharge, result: finalSim };
}

/**
 * Solves the exact charge weight required to achieve a target filling ratio (loading density %).
 */
export function solveChargeForFillRatio(
  baseInput: BallisticsInput,
  targetFillPct: number
): SolvedLoadPoint {
  const grossCaseVolCm3 = baseInput.cartridge.overflow_capacity_gr_h2o * 0.06479891;
  const seatingDepthCm = baseInput.seatingDepthInches * 2.54;
  const bulletRadiusCm = (baseInput.cartridge.bullet_diameter_in * 2.54) / 2;
  const seatedBulletVolCm3 = Math.PI * Math.pow(bulletRadiusCm, 2) * seatingDepthCm * 0.95;
  const usableChamberVolCm3 = Math.max(0.1, grossCaseVolCm3 - seatedBulletVolCm3);

  const chargeMassG = (targetFillPct / 100) * usableChamberVolCm3 * baseInput.propellant.bulk_density_g_cm3;
  const rawGrains = chargeMassG * 15.4323584;
  const roundedCharge = Number(Math.max(0.5, rawGrains).toFixed(1));
  const result = simulateInteriorBallistics({ ...baseInput, chargeGrains: roundedCharge });

  return { chargeGrains: roundedCharge, result };
}

/**
 * Solves the exact charge weight whose barrel transit time matches an acoustic OBT node.
 */
export function solveChargeForOBTNode(
  baseInput: BallisticsInput,
  targetTimeMs: number
): SolvedLoadPoint | null {
  const { minBound, maxBound } = getChargeBounds(baseInput);
  let low = minBound;
  let high = maxBound;
  let bestCharge = low;

  // Barrel time decreases as charge weight increases (bullet travels faster)
  for (let iter = 0; iter < 16; iter++) {
    const mid = (low + high) / 2;
    const sim = simulateInteriorBallistics({ ...baseInput, chargeGrains: mid });
    bestCharge = mid;

    if (sim.barrel_time_ms > targetTimeMs) {
      // Transit time is too long -> needs more velocity / higher charge
      low = mid;
    } else {
      // Transit time is too fast -> needs less charge
      high = mid;
    }
  }

  // Verify that the solved time is close to target (within 0.05 ms)
  const finalCheck = simulateInteriorBallistics({ ...baseInput, chargeGrains: bestCharge });
  if (Math.abs(finalCheck.barrel_time_ms - targetTimeMs) > 0.05) {
    return null;
  }

  const roundedCharge = Number(bestCharge.toFixed(1));
  const finalSim = simulateInteriorBallistics({ ...baseInput, chargeGrains: roundedCharge });
  return { chargeGrains: roundedCharge, result: finalSim };
}

/**
 * Computes the complete safe working range envelope and OBT harmonic nodes.
 */
export function computeSafeChargeEnvelope(baseInput: BallisticsInput): SafeChargeEnvelope {
  const mapBar = baseInput.cartridge.max_pressure_bar;
  const mapPsi = Math.round(mapBar * 14.5038);

  // 1. Solve Maximum Safe Working Load (100.0% MAP)
  const maxSafeLoad = solveChargeForPressure(baseInput, mapBar);

  // 2. Solve Proof / Overpressure Threshold (105.0% MAP)
  const proofLimitLoad = solveChargeForPressure(baseInput, mapBar * 1.05);

  // 3. Solve Standard Starting Load (-10% reduction rule)
  let rawStartCharge = Number((maxSafeLoad.chargeGrains * 0.90).toFixed(1));
  let startSim = simulateInteriorBallistics({ ...baseInput, chargeGrains: rawStartCharge });

  // Sanity check: if 10% reduction drops pressure below 65% MAP or 1700 bar, solve for 72% MAP
  if (startSim.max_pressure_bar < mapBar * 0.65 || startSim.max_pressure_bar < 1700) {
    const adjustedStart = solveChargeForPressure(baseInput, mapBar * 0.72);
    rawStartCharge = adjustedStart.chargeGrains;
    startSim = adjustedStart.result;
  }

  const startLoad: SolvedLoadPoint = {
    chargeGrains: rawStartCharge,
    result: startSim,
  };

  // 4. Solve 100% Non-Compressed Case Fill
  const bulkFill100Load = solveChargeForFillRatio(baseInput, 100.0);

  // 5. Compute Chris Long OBT Nodes & Solve Charge Weights
  const theoreticalNodes = calculateOBTNodes(baseInput.barrelLengthInches, maxSafeLoad.result.barrel_time_ms);
  const solvedNodes: SolvedOBTNode[] = [];

  for (const node of theoreticalNodes) {
    const solved = solveChargeForOBTNode(baseInput, node.target_time_ms);
    if (!solved) continue;

    const inSafeRange = solved.chargeGrains >= startLoad.chargeGrains && solved.chargeGrains <= maxSafeLoad.chargeGrains;
    solvedNodes.push({
      nodeNumber: node.node_number,
      targetTimeMs: node.target_time_ms,
      chargeGrains: solved.chargeGrains,
      muzzleVelocityFps: solved.result.muzzle_velocity_fps,
      maxPressureBar: solved.result.max_pressure_bar,
      pressureMarginPct: solved.result.pressure_margin_pct,
      fillRatioPct: solved.result.loading_density_pct,
      burnPct: solved.result.propellant_burnt_pct,
      status: solved.result.pressure_status,
      inSafeRange,
      isRecommendedSweetSpot: false,
    });
  }

  // Identify Recommended Sweet Spot Node (safe node closest to midpoint of working range)
  const safeNodes = solvedNodes.filter(n => n.inSafeRange);
  let sweetSpotLoad: SolvedLoadPoint | null = null;

  if (safeNodes.length > 0) {
    const midRangeCharge = (startLoad.chargeGrains + maxSafeLoad.chargeGrains) / 2;
    safeNodes.sort((a, b) => Math.abs(a.chargeGrains - midRangeCharge) - Math.abs(b.chargeGrains - midRangeCharge));
    const bestNode = safeNodes[0];
    bestNode.isRecommendedSweetSpot = true;

    sweetSpotLoad = {
      chargeGrains: bestNode.chargeGrains,
      result: simulateInteriorBallistics({ ...baseInput, chargeGrains: bestNode.chargeGrains }),
    };
  }

  // 6. Generate Workup Stepping Ladder across Safe Range
  let stepIncrement = 0.3;
  const chargeSpan = maxSafeLoad.chargeGrains - startLoad.chargeGrains;
  if (maxSafeLoad.chargeGrains < 15) {
    stepIncrement = 0.1;
  } else if (maxSafeLoad.chargeGrains < 35) {
    stepIncrement = 0.2;
  } else if (maxSafeLoad.chargeGrains >= 65) {
    stepIncrement = 0.5;
  }

  const ladderSteps: ChargeWorkupStep[] = [];
  const targetStepsCount = Math.max(6, Math.min(14, Math.round(chargeSpan / stepIncrement) + 1));
  const calculatedIncrement = chargeSpan / (targetStepsCount - 1);

  for (let i = 0; i < targetStepsCount; i++) {
    const charge = Number((startLoad.chargeGrains + i * calculatedIncrement).toFixed(1));
    const sim = simulateInteriorBallistics({ ...baseInput, chargeGrains: charge });

    // Check OBT node match
    let nearestNodeNum: number | undefined;
    let nearestDelta: number | undefined;
    let isSweet = false;

    if (theoreticalNodes.length > 0) {
      let minDelta = Infinity;
      for (const n of theoreticalNodes) {
        const delta = Math.abs(sim.barrel_time_ms - n.target_time_ms);
        if (delta < minDelta) {
          minDelta = delta;
          nearestNodeNum = n.node_number;
          nearestDelta = Number((sim.barrel_time_ms - n.target_time_ms).toFixed(4));
        }
      }
      if (minDelta <= 0.015) {
        isSweet = true;
      }
    }

    ladderSteps.push({
      chargeGrains: charge,
      maxPressureBar: sim.max_pressure_bar,
      maxPressurePsi: sim.max_pressure_psi,
      pressureMarginPct: sim.pressure_margin_pct,
      muzzleVelocityFps: sim.muzzle_velocity_fps,
      muzzleVelocityMps: sim.muzzle_velocity_mps,
      fillRatioPct: sim.loading_density_pct,
      burnPct: sim.propellant_burnt_pct,
      barrelTimeMs: sim.barrel_time_ms,
      nearestNodeNumber: nearestNodeNum,
      nearestNodeDeltaMs: nearestDelta,
      isSweetSpot: isSweet,
      isStartingLoad: i === 0,
      isMaxSafeLoad: i === targetStepsCount - 1,
      status: sim.pressure_status,
    });
  }

  // 7. Assess Propellant Suitability & Diagnostics
  const burnAtMax = maxSafeLoad.result.propellant_burnt_pct;
  const fillAtMax = maxSafeLoad.result.loading_density_pct;
  const diagnostics: string[] = [];
  let verdict: PropellantSuitability['verdict'] = 'optimal';
  let verdictLabel = 'Highly Balanced Propellant Match';

  if (burnAtMax >= 98.0) {
    diagnostics.push(`Outstanding combustion efficiency (${burnAtMax}% burnt at muzzle; minimal blast & flash).`);
  } else if (burnAtMax >= 94.0) {
    diagnostics.push(`Good combustion efficiency (${burnAtMax}% burnt at muzzle).`);
  } else {
    diagnostics.push(`Incomplete combustion (${(100 - burnAtMax).toFixed(1)}% unburnt powder exiting muzzle; consider a slightly faster powder).`);
  }

  if (fillAtMax >= 85.0 && fillAtMax <= 100.0) {
    diagnostics.push(`Optimal case loading density (${fillAtMax.toFixed(1)}% fill; consistent ignition without compression).`);
  } else if (fillAtMax > 100.0 && fillAtMax <= 105.0) {
    diagnostics.push(`Light powder compression required at maximum load (${fillAtMax.toFixed(1)}% fill; safe for quality brass).`);
    verdict = 'acceptable';
    verdictLabel = 'Acceptable (Mild Compression)';
  } else if (fillAtMax > 105.0) {
    diagnostics.push(`Heavy powder compression (${fillAtMax.toFixed(1)}% fill; powder may be too bulky or slow for this bullet weight).`);
    verdict = 'suboptimal_compression';
    verdictLabel = 'Sub-Optimal (Heavy Compression)';
  } else if (fillAtMax < 75.0) {
    diagnostics.push(`Low loading density (${fillAtMax.toFixed(1)}% fill; risk of erratic ignition or secondary explosion effect).`);
    verdict = 'suboptimal_underfill';
    verdictLabel = 'Sub-Optimal (Low Case Fill)';
  }

  if (sweetSpotLoad) {
    diagnostics.push(`Acoustic OBT harmonic sweet spot identified at ${sweetSpotLoad.chargeGrains} gr (${sweetSpotLoad.result.muzzle_velocity_fps} fps).`);
  }

  const suitability: PropellantSuitability = {
    verdict,
    verdictLabel,
    burnEfficiencyPct: burnAtMax,
    fillRatioAtMaxPct: fillAtMax,
    velocityPotentialFps: maxSafeLoad.result.muzzle_velocity_fps,
    diagnostics,
  };

  return {
    cartridge: baseInput.cartridge,
    projectile: baseInput.projectile,
    propellant: baseInput.propellant,
    barrelLengthInches: baseInput.barrelLengthInches,
    mapPressureBar: mapBar,
    mapPressurePsi: mapPsi,
    startLoad,
    maxSafeLoad,
    proofLimitLoad,
    bulkFill100Load,
    sweetSpotLoad,
    solvedNodes,
    ladderSteps,
    suitability,
  };
}

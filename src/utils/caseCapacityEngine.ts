/**
 * Fired Case Water Weight Calibration Engine.
 * Calculates exact physical chamber capacity from dry vs. water-filled case measurements,
 * accounting for water thermal expansion.
 */

export interface CaseWaterInput {
  dryWeightGrains: number;
  waterFilledWeightGrains: number;
  waterTemperatureF?: number; // default 68°F (20°C)
  nominalCapacityGrainsH2O?: number;
}

export interface CaseWaterResult {
  overflowCapacityGrainsH2O: number;
  overflowCapacityCm3: number;
  netWaterWeightGrains: number;
  deltaFromNominalGrains: number;
  deltaFromNominalPct: number;
  densityCorrectionFactor: number;
}

export function calculateFiredCaseWaterCapacity(input: CaseWaterInput): CaseWaterResult {
  const {
    dryWeightGrains,
    waterFilledWeightGrains,
    waterTemperatureF = 68,
    nominalCapacityGrainsH2O = 0,
  } = input;

  const rawWaterWeight = Math.max(0, waterFilledWeightGrains - dryWeightGrains);

  // Water density temperature compensation (referenced to 4°C peak density of 1.0000 g/cm³)
  // At 68°F (20°C), density is 0.9982 g/cm³
  const tempC = (waterTemperatureF - 32) * (5 / 9);
  // Empirical water density polynomial (Kell, 1975)
  const rhoWater = (999.83952 + 16.945176 * tempC - 7.9870401e-3 * Math.pow(tempC, 2)) /
                   (1000 * (1 + 1.687985e-2 * tempC)); // g/cm³

  const refDensity = 0.998203; // g/cm³ at 20°C
  const densityFactor = refDensity / Math.max(0.95, rhoWater);

  const overflowCapacityGrainsH2O = Number((rawWaterWeight * densityFactor).toFixed(2));
  const overflowCapacityCm3 = Number((overflowCapacityGrainsH2O * 0.06479891).toFixed(3));

  const deltaGrains = nominalCapacityGrainsH2O > 0 
    ? Number((overflowCapacityGrainsH2O - nominalCapacityGrainsH2O).toFixed(2)) 
    : 0;
  const deltaPct = nominalCapacityGrainsH2O > 0 
    ? Number(((deltaGrains / nominalCapacityGrainsH2O) * 100).toFixed(1)) 
    : 0;

  return {
    overflowCapacityGrainsH2O,
    overflowCapacityCm3,
    netWaterWeightGrains: Number(rawWaterWeight.toFixed(2)),
    deltaFromNominalGrains: deltaGrains,
    deltaFromNominalPct: deltaPct,
    densityCorrectionFactor: Number(densityFactor.toFixed(4)),
  };
}

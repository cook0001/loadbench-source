/**
 * Cartridge Base To Ogive (CBTO), Bullet Jump & Freebore Throat Erosion Engine.
 */

export interface ComparatorInsert {
  name: string;
  nominalCaliberIn: number;
  insertDiameterIn: number;
}

export const STANDARD_COMPARATOR_INSERTS: ComparatorInsert[] = [
  { name: '.17 Cal (0.170")', nominalCaliberIn: 0.172, insertDiameterIn: 0.170 },
  { name: '.20 Cal (0.200")', nominalCaliberIn: 0.204, insertDiameterIn: 0.200 },
  { name: '.22 Cal (0.218")', nominalCaliberIn: 0.224, insertDiameterIn: 0.218 },
  { name: '6mm (0.237")', nominalCaliberIn: 0.243, insertDiameterIn: 0.237 },
  { name: '.25 Cal (0.250")', nominalCaliberIn: 0.257, insertDiameterIn: 0.250 },
  { name: '6.5mm (0.257")', nominalCaliberIn: 0.264, insertDiameterIn: 0.257 },
  { name: '.270 Cal (0.270")', nominalCaliberIn: 0.277, insertDiameterIn: 0.270 },
  { name: '7mm (0.280")', nominalCaliberIn: 0.284, insertDiameterIn: 0.280 },
  { name: '.30 Cal (0.300")', nominalCaliberIn: 0.308, insertDiameterIn: 0.300 },
  { name: '.338 Cal (0.330")', nominalCaliberIn: 0.338, insertDiameterIn: 0.330 },
  { name: '.375 Cal (0.365")', nominalCaliberIn: 0.375, insertDiameterIn: 0.365 },
  { name: '.416 Cal (0.408")', nominalCaliberIn: 0.416, insertDiameterIn: 0.408 },
  { name: '.458 Cal (0.450")', nominalCaliberIn: 0.458, insertDiameterIn: 0.450 },
  { name: '.50 BMG (0.490")', nominalCaliberIn: 0.510, insertDiameterIn: 0.490 },
];

export interface CBTOInput {
  caseLengthInches: number;
  bulletLengthInches: number;
  bulletDiameterInches: number;
  seatingDepthInches: number;
  comparatorInsertDiameterInches?: number;
  measuredCbtoTouchingLandsInches?: number;
  roundCountFired?: number;
  peakPressurePsi?: number;
  heatOfExplosionJPerG?: number;
}

export interface CBTOResult {
  calculatedCoalInches: number;
  calculatedCbtoInches: number;
  bulletBaseToOgiveInches: number;
  comparatorDiameterInches: number;
  jumpToLandsInches: number; // Positive = jump (gap), 0 = touching lands, Negative = jammed into lands
  jumpStatus: 'jammed' | 'touching' | 'hybrid_tight' | 'standard_jump' | 'long_freebore';
  jumpStatusDescription: string;
  estimatedThroatErosionInches: number;
  currentErodedLandsCbtoInches: number;
}

/**
 * Calculates CBTO, jump to rifling lands, and estimated throat erosion.
 */
export function calculateCBTO(input: CBTOInput): CBTOResult {
  const {
    caseLengthInches,
    bulletLengthInches,
    bulletDiameterInches,
    seatingDepthInches,
    comparatorInsertDiameterInches,
    measuredCbtoTouchingLandsInches,
    roundCountFired = 0,
    peakPressurePsi = 55000,
    heatOfExplosionJPerG = 4000,
  } = input;

  // Find or default comparator insert diameter
  const defaultInsert = STANDARD_COMPARATOR_INSERTS.reduce((prev, curr) => {
    return Math.abs(curr.nominalCaliberIn - bulletDiameterInches) < Math.abs(prev.nominalCaliberIn - bulletDiameterInches)
      ? curr
      : prev;
  }, STANDARD_COMPARATOR_INSERTS[0]);

  const compDia = comparatorInsertDiameterInches || defaultInsert.insertDiameterIn;

  // Approximate distance from bullet base to comparator ogive datum
  // Tangent / secant ogive estimation:
  const noseLength = bulletLengthInches * 0.55;
  const diaRatio = Math.max(0.1, Math.min(1.0, compDia / bulletDiameterInches));
  const ogiveSetback = noseLength * (1.0 - Math.sqrt(Math.max(0, 1.0 - Math.pow(diaRatio, 2))));
  const bulletBaseToOgive = Math.max(0.1, (bulletLengthInches - ogiveSetback));

  // COAL = Case Length + Bullet Length - Seating Depth
  const calculatedCoalInches = caseLengthInches + bulletLengthInches - seatingDepthInches;

  // CBTO = Case Length + BTO - Seating Depth
  const calculatedCbtoInches = caseLengthInches + bulletBaseToOgive - seatingDepthInches;

  // Throat Erosion Calculation:
  // Baseline: ~0.0018" per 100 rounds at 60,000 psi / 4,000 J/g
  const erosionRatePer100 = 0.0018 * (peakPressurePsi / 60000) * (heatOfExplosionJPerG / 4000);
  const estimatedThroatErosionInches = (roundCountFired / 100) * erosionRatePer100;

  // Measured or default zero-jump lands reference
  const nominalLandsCbto = measuredCbtoTouchingLandsInches || (calculatedCbtoInches + 0.020);
  const currentErodedLandsCbtoInches = nominalLandsCbto + estimatedThroatErosionInches;

  // Jump to lands = Lands CBTO - Loaded CBTO
  const jumpToLandsInches = currentErodedLandsCbtoInches - calculatedCbtoInches;

  // Jump Status Categorization
  let jumpStatus: CBTOResult['jumpStatus'] = 'standard_jump';
  let jumpStatusDescription = 'Standard target jump (0.015" - 0.035"). Reliable feeding & consistent pressures.';

  if (jumpToLandsInches < -0.002) {
    jumpStatus = 'jammed';
    jumpStatusDescription = `Jammed into lands by ${Math.abs(jumpToLandsInches).toFixed(3)}". Engraving resistance adds +100 to +180 bar initial pressure spike!`;
  } else if (Math.abs(jumpToLandsInches) <= 0.002) {
    jumpStatus = 'touching';
    jumpStatusDescription = 'Touching lands (0.000" jump). Zero free-flight transition; maximum initial engraving resistance.';
  } else if (jumpToLandsInches <= 0.015) {
    jumpStatus = 'hybrid_tight';
    jumpStatusDescription = 'Tight match jump (0.003" - 0.015"). Favored for VLD and Hybrid tangent/secant match bullets.';
  } else if (jumpToLandsInches > 0.040) {
    jumpStatus = 'long_freebore';
    jumpStatusDescription = 'Long jump (>0.040"). Common in magazine-restricted SAAMI hunting chambers or weatherby freebores.';
  }

  return {
    calculatedCoalInches,
    calculatedCbtoInches,
    bulletBaseToOgiveInches: bulletBaseToOgive,
    comparatorDiameterInches: compDia,
    jumpToLandsInches,
    jumpStatus,
    jumpStatusDescription,
    estimatedThroatErosionInches,
    currentErodedLandsCbtoInches,
  };
}

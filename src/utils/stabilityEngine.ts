/**
 * Army Research Laboratory (ARL) Don Miller Gyroscopic Stability & Twist Rate Engine.
 * Accurately models projectile gyroscopic spin stability factor (Sg) and optimal rifling twist.
 */

export interface StabilityInput {
  bulletWeightGrains: number;
  bulletLengthInches: number;
  bulletDiameterInches: number;
  barrelTwistInches: number; // e.g. 8 for 1:8" twist
  muzzleVelocityFps: number;
  temperatureF?: number;     // Ambient / powder temperature (default 59°F)
  pressureInHg?: number;     // Barometric pressure (default 29.92 inHg)
}

export type StabilityClassification = 'unstable' | 'marginal' | 'optimal' | 'over_stabilized';

export interface StabilityResult {
  sg: number;
  classification: StabilityClassification;
  statusLabel: string;
  statusColor: string;
  minTwistInches: number;     // Twist required to reach Sg = 1.4
  optimalTwistInches: number; // Twist required to reach Sg = 1.75
  bcRetentionPct: number;    // % of full G1/G7 BC realized downrange
}

export function calculateGyroscopicStability(input: StabilityInput): StabilityResult {
  const {
    bulletWeightGrains,
    bulletLengthInches,
    bulletDiameterInches,
    barrelTwistInches,
    muzzleVelocityFps,
    temperatureF = 59,
    pressureInHg = 29.92,
  } = input;

  const d = Math.max(0.1, bulletDiameterInches);
  const m = Math.max(1, bulletWeightGrains);
  const lInches = Math.max(d * 1.05, bulletLengthInches);
  const twist = Math.max(2.0, barrelTwistInches);
  const v = Math.max(400, muzzleVelocityFps);

  // Length in calibers (cal)
  const lCal = lInches / d;

  // Twist in calibers (T)
  const tCal = twist / d;

  // Don Miller baseline gyroscopic stability formula (ARL):
  // Sg = [30 * m] / [tCal^2 * d^3 * lCal * (1 + lCal^2)]
  const denom = Math.pow(tCal, 2) * Math.pow(d, 3) * lCal * (1 + Math.pow(lCal, 2));
  const sgBase = (30 * m) / denom;

  // Velocity correction factor (referenced to 2,800 fps)
  const velFactor = Math.pow(v / 2800, 1 / 3);

  // Atmospheric correction factor (referenced to standard sea level 59°F and 29.92 inHg)
  const tempK = (temperatureF + 459.67) / (59 + 459.67);
  const pressK = 29.92 / Math.max(15, pressureInHg);
  const atmoFactor = tempK * pressK;

  const rawSg = sgBase * velFactor * atmoFactor;
  const sg = Number(Math.max(0.1, rawSg).toFixed(2));

  // Compute required twist for Sg = 1.4 (marginal threshold) and Sg = 1.75 (optimal match)
  // Since Sg proportional to 1/twist^2, twist_req = twist * sqrt(current_sg / target_sg)
  const minTwistInches = Number((twist * Math.sqrt(sg / 1.4)).toFixed(1));
  const optimalTwistInches = Number((twist * Math.sqrt(sg / 1.75)).toFixed(1));

  let classification: StabilityClassification = 'optimal';
  let statusLabel = 'Optimal Match Stability (1.4 – 2.0)';
  let statusColor = 'var(--status-safe)';
  let bcRetentionPct = 100;

  if (sg < 1.0) {
    classification = 'unstable';
    statusLabel = 'Unstable (Tumbling / Keyholing)';
    statusColor = 'var(--status-danger)';
    bcRetentionPct = Math.round(sg * 70);
  } else if (sg < 1.4) {
    classification = 'marginal';
    statusLabel = 'Marginally Stable (Hunting Acceptable)';
    statusColor = 'var(--status-caution)';
    bcRetentionPct = Math.round(100 - (1.4 - sg) * 25);
  } else if (sg <= 2.2) {
    classification = 'optimal';
    statusLabel = 'Optimal Match Stability (1.4 – 2.0)';
    statusColor = 'var(--status-safe)';
    bcRetentionPct = 100;
  } else {
    classification = 'over_stabilized';
    statusLabel = 'Over-Stabilized (Elevated Spin Drift)';
    statusColor = 'var(--accent-blue)';
    bcRetentionPct = 100;
  }

  return {
    sg,
    classification,
    statusLabel,
    statusColor,
    minTwistInches,
    optimalTwistInches,
    bcRetentionPct,
  };
}

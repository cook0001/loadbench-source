/**
 * High-Precision Firearm Recoil Dynamics Engine (SAAMI / Army Technical Manual method).
 * Calculates Free Recoil Energy, Recoil Velocity, Impulse, and Muzzle Brake / Suppressor attenuation.
 */

export interface RecoilInput {
  bulletWeightGrains: number;
  powderChargeGrains: number;
  muzzleVelocityFps: number;
  rifleWeightLbs: number;
  muzzleBrakeEfficiencyPct?: number; // 0% (bare muzzle) to 70% (competition 3-port brake)
}

export interface RecoilResult {
  recoilEnergyFtLbs: number;
  recoilEnergyJoules: number;
  recoilVelocityFps: number;
  recoilVelocityMps: number;
  recoilImpulseLbSec: number;
  recoilImpulseNs: number;
  perceivedCategory: 'Mild / Varmint' | 'Moderate / Standard' | 'Heavy / Magnum' | 'Severe / Dangerous Game';
  effectiveReductionFtLbs: number;
}

export function calculateRecoilDynamics(input: RecoilInput): RecoilResult {
  const {
    bulletWeightGrains,
    powderChargeGrains,
    muzzleVelocityFps,
    rifleWeightLbs,
    muzzleBrakeEfficiencyPct = 0,
  } = input;

  const rifleMass = Math.max(1.0, rifleWeightLbs);
  const brakeEff = Math.max(0, Math.min(0.85, (muzzleBrakeEfficiencyPct || 0) / 100));

  // Propellant gas exit velocity (typically 4,700 fps for high-power rifle, 4,000 for standard, 1.5x muzzle vel for handgun)
  let vGas = 4700;
  if (muzzleVelocityFps < 1800) {
    vGas = Math.max(1200, muzzleVelocityFps * 1.5);
  } else if (muzzleVelocityFps < 2500) {
    vGas = 4000;
  }

  // Conservation of momentum: Total Momentum (gr * fps)
  const totalMomentumGrFps = (bulletWeightGrains * muzzleVelocityFps) + (powderChargeGrains * vGas);

  // Recoil velocity (fps) = Total Momentum / (Rifle Weight * 7000 gr/lb)
  const recoilVelocityFps = totalMomentumGrFps / (rifleMass * 7000);

  // Impulse (lb-sec)
  const recoilImpulseLbSec = totalMomentumGrFps / (7000 * 32.174);

  // Free recoil energy (ft-lbs) = 0.5 * (Rifle Mass / g) * (V_recoil)^2
  const rawRecoilEnergyFtLbs = (rifleMass * Math.pow(recoilVelocityFps, 2)) / (2 * 32.174);

  // Attenuated energy with muzzle brake / suppressor
  const netRecoilEnergyFtLbs = rawRecoilEnergyFtLbs * (1 - brakeEff);
  const reductionFtLbs = rawRecoilEnergyFtLbs - netRecoilEnergyFtLbs;

  // Metric conversions
  const recoilEnergyJoules = netRecoilEnergyFtLbs * 1.355818;
  const recoilVelocityMps = (recoilVelocityFps * Math.sqrt(1 - brakeEff)) * 0.3048;
  const recoilImpulseNs = recoilImpulseLbSec * 4.44822;

  let perceivedCategory: RecoilResult['perceivedCategory'] = 'Moderate / Standard';
  if (netRecoilEnergyFtLbs < 10) {
    perceivedCategory = 'Mild / Varmint';
  } else if (netRecoilEnergyFtLbs < 25) {
    perceivedCategory = 'Moderate / Standard';
  } else if (netRecoilEnergyFtLbs < 45) {
    perceivedCategory = 'Heavy / Magnum';
  } else {
    perceivedCategory = 'Severe / Dangerous Game';
  }

  return {
    recoilEnergyFtLbs: Number(netRecoilEnergyFtLbs.toFixed(1)),
    recoilEnergyJoules: Number(recoilEnergyJoules.toFixed(1)),
    recoilVelocityFps: Number((recoilVelocityFps * Math.sqrt(1 - brakeEff)).toFixed(1)),
    recoilVelocityMps: Number(recoilVelocityMps.toFixed(2)),
    recoilImpulseLbSec: Number(recoilImpulseLbSec.toFixed(2)),
    recoilImpulseNs: Number(recoilImpulseNs.toFixed(2)),
    perceivedCategory,
    effectiveReductionFtLbs: Number(reductionFtLbs.toFixed(1)),
  };
}

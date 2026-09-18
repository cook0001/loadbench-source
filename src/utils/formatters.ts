/**
 * Ballistics and physical unit conversions and display formatters.
 */

export const PSI_PER_BAR = 14.503773773;
export const GRAINS_PER_GRAM = 15.4323584;
export const MM_PER_INCH = 25.4;
export const FPS_PER_MPS = 3.2808399;
export const JOULES_PER_FT_LB = 1.3558179483;

// Conversions
export function barToPsi(bar: number): number {
  return bar * PSI_PER_BAR;
}

export function psiToBar(psi: number): number {
  return psi / PSI_PER_BAR;
}

export function grainsToGrams(grains: number): number {
  return grains / GRAINS_PER_GRAM;
}

export function gramsToGrains(grams: number): number {
  return grams * GRAINS_PER_GRAM;
}

export function inchesToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

export function mmToInches(mm: number): number {
  return mm / MM_PER_INCH;
}

export function mpsToFps(mps: number): number {
  return mps * FPS_PER_MPS;
}

export function fpsToMps(fps: number): number {
  return fps / FPS_PER_MPS;
}

export function ftLbsToJoules(ftLbs: number): number {
  return ftLbs * JOULES_PER_FT_LB;
}

export function joulesToFtLbs(joules: number): number {
  return joules / JOULES_PER_FT_LB;
}

// Formatters
export function formatPressure(bar: number, isMetric = false): string {
  if (isMetric) {
    return `${Math.round(bar).toLocaleString()} bar`;
  }
  return `${Math.round(barToPsi(bar)).toLocaleString()} psi`;
}

export function formatVelocity(fps: number, isMetric = false): string {
  if (isMetric) {
    return `${Math.round(fpsToMps(fps)).toLocaleString()} m/s`;
  }
  return `${Math.round(fps).toLocaleString()} fps`;
}

export function formatEnergy(ftLbs: number, isMetric = false): string {
  if (isMetric) {
    return `${Math.round(ftLbsToJoules(ftLbs)).toLocaleString()} J`;
  }
  return `${Math.round(ftLbs).toLocaleString()} ft-lbs`;
}

export function formatLength(inches: number, decimals = 3, isMetric = false): string {
  if (isMetric) {
    return `${inchesToMm(inches).toFixed(decimals)} mm`;
  }
  return `${inches.toFixed(decimals)}"`;
}

export function formatWeight(grains: number, decimals = 1, isMetric = false): string {
  if (isMetric) {
    return `${grainsToGrams(grains).toFixed(decimals + 1)} g`;
  }
  return `${grains.toFixed(decimals)} gr`;
}

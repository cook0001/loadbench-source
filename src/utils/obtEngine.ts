import { OBTNode } from '../types/ballistics';

/**
 * Chris Long's Optimal Barrel Time (OBT) harmonic node calculator.
 * Predicts acoustic stress wave transit times in rifle barrels.
 */

// Baseline OBT node transit times for a standard 24" barrel (in milliseconds)
const OBT_24_INCH_BASELINE: Record<number, number> = {
  1: 1.625,
  2: 1.455,
  3: 1.305,
  4: 1.170,
  5: 1.050,
  6: 0.940,
  7: 0.840,
};

/**
 * Calculates theoretical OBT node target times for a given barrel length.
 * Standard scaling is proportional to (barrelLength / 24) to the power of ~1.05
 * based on Chris Long's finite-element acoustic stress propagation model.
 */
export function calculateOBTNodes(barrelLengthInches: number, currentBarrelTimeMs: number): OBTNode[] {
  const scaleFactor = Math.pow(barrelLengthInches / 24.0, 1.035);

  const nodes: OBTNode[] = [];

  for (let n = 1; n <= 7; n++) {
    const baseTime = OBT_24_INCH_BASELINE[n];
    const targetTime = Number((baseTime * scaleFactor).toFixed(4));
    const delta = Number((currentBarrelTimeMs - targetTime).toFixed(4));
    const absDelta = Math.abs(delta);

    let status: 'exact' | 'near' | 'off' = 'off';
    if (absDelta <= 0.015) {
      status = 'exact';
    } else if (absDelta <= 0.040) {
      status = 'near';
    }

    nodes.push({
      node_number: n,
      target_time_ms: targetTime,
      delta_ms: delta,
      status,
    });
  }

  return nodes;
}

/**
 * Finds the nearest OBT node to the current barrel time.
 */
export function findNearestOBTNode(nodes: OBTNode[]): OBTNode {
  return nodes.reduce((prev, curr) => 
    Math.abs(curr.delta_ms) < Math.abs(prev.delta_ms) ? curr : prev
  );
}

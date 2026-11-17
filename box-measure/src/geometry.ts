/** Pure geometry for box measuring. Units are metres; Y is up (ARKit/ARCore world space). */

export type Vec3 = [number, number, number];

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const distance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Where a ray meets the horizontal plane y = floorY, or null if it never does within maxRange. */
export function rayToFloor(origin: Vec3, dir: Vec3, floorY: number, maxRange = 10): Vec3 | null {
  if (Math.abs(dir[1]) < 1e-4) return null;
  const t = (floorY - origin[1]) / dir[1];
  if (t <= 0 || t > maxRange) return null;
  return [origin[0] + dir[0] * t, floorY, origin[2] + dir[2] * t];
}

/**
 * Base rectangle from one measured edge (a→b) and a third floor point that
 * marks how far the opposite edge is. Only the third point's perpendicular
 * distance from the a–b line matters, so it need not be an exact corner.
 * Returns corners in order [a, b, b', a'], flattened to a's height.
 */
export function baseRectangle(a: Vec3, b: Vec3, third: Vec3): { corners: Vec3[]; width: number } | null {
  const y = a[1];
  const ex = b[0] - a[0];
  const ez = b[2] - a[2];
  const len = Math.hypot(ex, ez);
  if (len < 1e-6) return null;
  // Horizontal unit normal of the a–b edge.
  const nx = -ez / len;
  const nz = ex / len;
  const signed = (third[0] - a[0]) * nx + (third[2] - a[2]) * nz;
  const off: Vec3 = [nx * signed, 0, nz * signed];
  const a0: Vec3 = [a[0], y, a[2]];
  const b0: Vec3 = [b[0], y, b[2]];
  return { corners: [a0, b0, add(b0, off), add(a0, off)], width: Math.abs(signed) };
}

/**
 * Box height from where the camera is aiming. The user aims at the top edge
 * of the box; the ray is intersected with the vertical walls standing on the
 * base rectangle, and the first wall it enters gives the height. If the ray
 * misses every wall, the vertical line above the nearest corner is used.
 */
export function heightFromRay(origin: Vec3, dir: Vec3, corners: Vec3[], maxHeight = 3): number | null {
  const floorY = corners[0][1];
  const dx = dir[0];
  const dz = dir[2];
  if (Math.hypot(dx, dz) < 1e-3) return null; // looking straight up/down

  let bestT = Infinity;
  for (let i = 0; i < corners.length; i++) {
    const p = corners[i];
    const q = corners[(i + 1) % corners.length];
    const ex = q[0] - p[0];
    const ez = q[2] - p[2];
    const det = ex * dz - ez * dx;
    if (Math.abs(det) < 1e-9) continue;
    const wx = p[0] - origin[0];
    const wz = p[2] - origin[2];
    const t = (ex * wz - ez * wx) / det; // along the ray
    const s = (dx * wz - dz * wx) / det; // along the edge
    if (t > 0 && s >= 0 && s <= 1 && t < bestT) bestT = t;
  }

  if (bestT === Infinity) {
    let bestMiss = Infinity;
    for (const c of corners) {
      const wx = c[0] - origin[0];
      const wz = c[2] - origin[2];
      const t = (wx * dx + wz * dz) / (dx * dx + dz * dz);
      if (t <= 0) continue;
      const miss = Math.hypot(wx - dx * t, wz - dz * t);
      if (miss < bestMiss) {
        bestMiss = miss;
        bestT = t;
      }
    }
    if (bestT === Infinity) return null;
  }

  const h = origin[1] + dir[1] * bestT - floorY;
  return Math.min(Math.max(h, 0), maxHeight);
}

/** True if a point's floor projection lies inside the base rectangle (shrunk by margin metres). */
export function insideBase(point: Vec3, corners: Vec3[], margin = 0): boolean {
  const [a, b, , d] = corners;
  const u = sub(b, a);
  const v = sub(d, a);
  const lu = Math.hypot(u[0], u[2]);
  const lv = Math.hypot(v[0], v[2]);
  if (lu < 1e-6 || lv < 1e-6) return false;
  const w = sub(point, a);
  const pu = (w[0] * u[0] + w[2] * u[2]) / lu;
  const pv = (w[0] * v[0] + w[2] * v[2]) / lv;
  return pu >= margin && pu <= lu - margin && pv >= margin && pv <= lv - margin;
}

/** The eight wireframe segments' top corners for a box of the given height. */
export function topCorners(corners: Vec3[], height: number): Vec3[] {
  return corners.map((c) => [c[0], c[1] + height, c[2]] as Vec3);
}

export const toCm = (metres: number): string => (metres * 100).toFixed(1);

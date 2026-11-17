import { expect, test } from "@jest/globals";
import { baseRectangle, heightFromRay, insideBase, rayToFloor, Vec3 } from './geometry';
import * as store from './store';

// A 40 × 30 × 20 cm box sitting on a floor at y = -1.2, its front edge 1 m ahead of the camera.
const FLOOR = -1.2;
const A: Vec3 = [-0.2, FLOOR, -1];
const B: Vec3 = [0.2, FLOOR, -1];
const BACK: Vec3 = [0.05, FLOOR, -1.3];
const CAM: Vec3 = [0, 0, 0];

const aimAt = (from: Vec3, to: Vec3): Vec3 => {
  const d: Vec3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const n = Math.hypot(...d);
  return [d[0] / n, d[1] / n, d[2] / n];
};

test('rayToFloor hits the floor point being aimed at', () => {
  const p = rayToFloor(CAM, aimAt(CAM, A), FLOOR)!;
  expect(p[0]).toBeCloseTo(A[0]);
  expect(p[2]).toBeCloseTo(A[2]);
  expect(rayToFloor(CAM, [0, 1, 0], FLOOR)).toBeNull();
});

test('baseRectangle uses only the perpendicular distance of the third point', () => {
  const r = baseRectangle(A, B, BACK)!;
  expect(r.width).toBeCloseTo(0.3);
  expect(r.corners[2][0]).toBeCloseTo(0.2);
  expect(r.corners[2][2]).toBeCloseTo(-1.3);
  expect(r.corners[3][0]).toBeCloseTo(-0.2);
  // Third point on the other side flips the rectangle.
  expect(baseRectangle(A, B, [0, FLOOR, -0.7])!.corners[2][2]).toBeCloseTo(-0.7);
});

test('heightFromRay reads the height when aiming at the near top edge', () => {
  const { corners } = baseRectangle(A, B, BACK)!;
  const h = heightFromRay(CAM, aimAt(CAM, [0.1, FLOOR + 0.2, -1]), corners)!;
  expect(h).toBeCloseTo(0.2);
});

test('heightFromRay works from the side and falls back to the nearest corner', () => {
  const { corners } = baseRectangle(A, B, BACK)!;
  const side: Vec3 = [1, 0, -1.15];
  expect(heightFromRay(side, aimAt(side, [0.2, FLOOR + 0.2, -1.1]), corners)!).toBeCloseTo(0.2);
  // Aiming just outside the corner still gives a sensible reading.
  const h = heightFromRay(CAM, aimAt(CAM, [-0.21, FLOOR + 0.2, -1]), corners)!;
  expect(h).toBeGreaterThan(0.15);
  expect(h).toBeLessThan(0.25);
  expect(heightFromRay(CAM, [0, -1, 0], corners)).toBeNull();
});

test('insideBase', () => {
  const { corners } = baseRectangle(A, B, BACK)!;
  expect(insideBase([0, 0, -1.15], corners)).toBe(true);
  expect(insideBase([0.3, 0, -1.15], corners)).toBe(false);
});

test('full measuring flow through the store', () => {
  store.reset();
  expect(store.confirm()).toBe(false); // nothing under the crosshair yet

  store.onFrame(CAM, aimAt(CAM, A), [{ type: 'FeaturePoint', position: A }]);
  expect(store.getState().reticle).toBeNull(); // feature points are not a floor
  store.onFrame(CAM, aimAt(CAM, A), [{ type: 'ExistingPlaneUsingExtent', position: A }]);
  expect(store.confirm()).toBe(true);

  store.onFrame(CAM, aimAt(CAM, B), []);
  expect(store.getState().length).toBeCloseTo(0.4);
  expect(store.confirm()).toBe(true);

  store.onFrame(CAM, aimAt(CAM, BACK), []);
  expect(store.confirm()).toBe(true);

  store.onFrame(CAM, aimAt(CAM, [0, FLOOR + 0.2, -1]), []);
  expect(store.getState().snapped).toBe(false);
  expect(store.confirm()).toBe(true);

  const s = store.getState();
  expect(s.step).toBe(4);
  expect(s.length).toBeCloseTo(0.4);
  expect(s.width).toBeCloseTo(0.3);
  expect(s.height).toBeCloseTo(0.2);

  // A detected top surface overrides aiming.
  store.undo();
  store.onFrame(CAM, [0, 0, -1], [{ type: 'ExistingPlaneUsingExtent', position: [0, FLOOR + 0.25, -1.1] }]);
  expect(store.getState().snapped).toBe(true);
  expect(store.getState().height).toBeCloseTo(0.25);

  store.undo();
  store.undo();
  store.undo();
  expect(store.getState().step).toBe(0);
  expect(store.getState().a).toBeNull();
});

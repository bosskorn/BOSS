import { baseRectangle, distance, heightFromRay, insideBase, rayToFloor, Vec3 } from './geometry';

/**
 * Measuring flow:
 *  0 aim at the first bottom corner of the box        → tap
 *  1 aim at the second bottom corner (same edge)      → tap
 *  2 aim at the floor along the opposite edge         → tap
 *  3 tilt up to the top edge of the box               → tap
 *  4 done
 */
export type Step = 0 | 1 | 2 | 3 | 4;

export type Hit = { type: string; position: Vec3 };

export type State = {
  step: Step;
  tracking: boolean;
  /** Point on the floor under the crosshair (steps 0–2). */
  reticle: Vec3 | null;
  a: Vec3 | null;
  b: Vec3 | null;
  /** Base rectangle: fixed after step 2, live preview during it. */
  corners: Vec3[] | null;
  length: number;
  width: number;
  height: number;
  /** Height came from a detected surface on top of the box rather than from aiming. */
  snapped: boolean;
};

const MIN_EDGE = 0.02;
const PLANE_TYPES = ['ExistingPlaneUsingExtent', 'ExistingPlane', 'EstimatedHorizontalPlane'];

const initial: State = {
  step: 0,
  tracking: false,
  reticle: null,
  a: null,
  b: null,
  corners: null,
  length: 0,
  width: 0,
  height: 0,
  snapped: false,
};

let state: State = initial;
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const getState = () => state;
export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function setTracking(tracking: boolean) {
  if (tracking !== state.tracking) set({ tracking });
}

/** Feed one camera frame: camera pose plus AR hit-test results under the crosshair. */
export function onFrame(camPos: Vec3, camForward: Vec3, hits: Hit[]) {
  const s = state;
  if (s.step === 0) {
    const hit = PLANE_TYPES.map((t) => hits.find((h) => h.type === t)).find(Boolean);
    set({ reticle: hit ? hit.position : null });
  } else if (s.step === 1 && s.a) {
    const reticle = rayToFloor(camPos, camForward, s.a[1]);
    set({ reticle, length: reticle ? distance(s.a, reticle) : 0 });
  } else if (s.step === 2 && s.a && s.b) {
    const reticle = rayToFloor(camPos, camForward, s.a[1]);
    const rect = reticle ? baseRectangle(s.a, s.b, reticle) : null;
    set({ reticle, corners: rect ? rect.corners : null, width: rect ? rect.width : 0 });
  } else if (s.step === 3 && s.corners) {
    const floorY = s.corners[0][1];
    const corners = s.corners;
    // A real surface detected on top of the box beats aiming by eye.
    const top = hits.find(
      (h) =>
        h.type === 'ExistingPlaneUsingExtent' &&
        h.position[1] - floorY > MIN_EDGE &&
        insideBase(h.position, corners, 0.01),
    );
    if (top) {
      set({ height: top.position[1] - floorY, snapped: true });
    } else {
      const h = heightFromRay(camPos, camForward, corners);
      if (h !== null) set({ height: h, snapped: false });
    }
  }
}

/** Confirm the current step. Returns false if there is nothing valid to confirm yet. */
export function confirm(): boolean {
  const s = state;
  if (s.step === 0 && s.reticle) {
    set({ step: 1, a: s.reticle, reticle: null, length: 0 });
    return true;
  }
  if (s.step === 1 && s.a && s.reticle && s.length >= MIN_EDGE) {
    set({ step: 2, b: s.reticle, reticle: null, width: 0, corners: null });
    return true;
  }
  if (s.step === 2 && s.corners && s.width >= MIN_EDGE) {
    set({ step: 3, reticle: null, height: 0, snapped: false });
    return true;
  }
  if (s.step === 3 && s.height >= MIN_EDGE) {
    set({ step: 4 });
    return true;
  }
  return false;
}

export function undo() {
  const s = state;
  if (s.step === 1) set({ step: 0, a: null, reticle: null, length: 0 });
  else if (s.step === 2) set({ step: 1, b: null, corners: null, reticle: null, width: 0 });
  else if (s.step === 3) set({ step: 2, height: 0, snapped: false });
  else if (s.step === 4) set({ step: 3 });
}

export function reset() {
  set({ ...initial, tracking: state.tracking });
}

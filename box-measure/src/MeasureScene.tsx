import { useSyncExternalStore } from 'react';
import {
  ViroARScene,
  ViroCameraARHitTest,
  ViroMaterials,
  ViroPolyline,
  ViroSphere,
  ViroTrackingState,
  ViroTrackingStateConstants,
} from '@reactvision/react-viro';
import { topCorners, Vec3 } from './geometry';
import { getState, onFrame, setTracking, subscribe } from './store';

ViroMaterials.createMaterials({
  line: { diffuseColor: '#19E68C', lightingModel: 'Constant' },
  dot: { diffuseColor: '#FFFFFF', lightingModel: 'Constant' },
});

const FRAME_INTERVAL_MS = 66;
let lastFrame = 0;

function handleHitTest(event: ViroCameraARHitTest) {
  const now = Date.now();
  if (now - lastFrame < FRAME_INTERVAL_MS) return;
  lastFrame = now;
  const cam = event.cameraOrientation;
  onFrame(
    cam.position,
    cam.forward,
    event.hitTestResults.map((r) => ({ type: r.type, position: r.transform.position })),
  );
}

function handleTracking(state: ViroTrackingState) {
  setTracking(state === ViroTrackingStateConstants.TRACKING_NORMAL);
}

const Line = ({ points }: { points: Vec3[] }) => (
  <ViroPolyline position={[0, 0, 0]} points={points} thickness={0.004} materials={['line']} />
);

const Dot = ({ at }: { at: Vec3 }) => (
  <ViroSphere position={at} radius={0.008} materials={['dot']} />
);

export default function MeasureScene() {
  const s = useSyncExternalStore(subscribe, getState);
  const top = s.corners && s.step >= 3 && s.height > 0.005 ? topCorners(s.corners, s.height) : null;

  return (
    <ViroARScene
      anchorDetectionTypes="PlanesHorizontal"
      onCameraARHitTest={handleHitTest}
      onTrackingUpdated={handleTracking}
    >
      {s.reticle && <Dot at={s.reticle} />}
      {s.a && <Dot at={s.a} />}
      {s.b && <Dot at={s.b} />}

      {/* First edge while it is being stretched out. */}
      {s.step === 1 && s.a && s.reticle && s.length > 0.01 && <Line points={[s.a, s.reticle]} />}
      {s.step === 2 && s.a && s.b && !s.corners && <Line points={[s.a, s.b]} />}

      {/* Base rectangle, then the full box. */}
      {s.corners && s.width > 0.01 && <Line points={[...s.corners, s.corners[0]]} />}
      {s.corners && top && (
        <>
          <Line points={[...top, top[0]]} />
          {s.corners.map((c, i) => (
            <Line key={i} points={[c, top[i]]} />
          ))}
        </>
      )}
    </ViroARScene>
  );
}

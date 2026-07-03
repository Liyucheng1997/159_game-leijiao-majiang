import { OrbitControls, PerspectiveCamera } from '@react-three/drei'

/** Elevated view from behind the human seat (south), looking at table center. */
export function CameraRig() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 9, 10.5]} fov={45} />
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        minDistance={5}
        maxDistance={18}
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.48}
      />
    </>
  )
}

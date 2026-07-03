export function TableSurface() {
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[6.1, 6.2, 0.3, 8]} />
        <meshStandardMaterial color="#1d5c3a" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.21, 0]}>
        <cylinderGeometry args={[6.25, 6.35, 0.15, 8]} />
        <meshStandardMaterial color="#3b2417" roughness={0.6} />
      </mesh>
    </group>
  )
}

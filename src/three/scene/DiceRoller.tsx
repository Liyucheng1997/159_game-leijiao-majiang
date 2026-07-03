import { useMemo } from 'react'
import { animated, useSpring } from '@react-spring/three'

const AnimatedGroup = animated.group

function Die({ seed }: { seed: number }) {
  const target = useMemo(() => {
    const rand = (n: number) => Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453 % 1
    return [Math.PI * 2 * rand(1), Math.PI * 2 * rand(2), Math.PI * 2 * rand(3)] as [number, number, number]
  }, [seed])

  const spring = useSpring({
    from: { rotation: [0, 0, 0] as [number, number, number] },
    to: { rotation: target },
    config: { mass: 2, tension: 120, friction: 14 },
  })

  return (
    <AnimatedGroup rotation={spring.rotation as unknown as [number, number, number]}>
      <mesh castShadow>
        <boxGeometry args={[0.34, 0.34, 0.34]} />
        <meshStandardMaterial color="#f2ede0" roughness={0.4} />
      </mesh>
    </AnimatedGroup>
  )
}

/** Purely decorative pair of dice that tumble to a resting orientation on mount. */
export function DiceRoller({ handKey }: { handKey: number }) {
  return (
    <group position={[0.3, 0.3, 0]}>
      <group position={[-0.25, 0, 0]}>
        <Die seed={handKey * 2 + 1} />
      </group>
      <group position={[0.25, 0, 0.3]}>
        <Die seed={handKey * 2 + 2} />
      </group>
    </group>
  )
}

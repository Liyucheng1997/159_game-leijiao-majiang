import { useMemo } from 'react'
import * as THREE from 'three'
import { animated, useSpring } from '@react-spring/three'
import { getBackTexture, getBodyMaterial, getBottomMaterial, getGlyphTexture } from './TileMaterials'
import type { FlowerKindId, TileKindId } from '../../engine/types'

const AnimatedMesh = animated.mesh

export const TILE_WIDTH = 0.6
export const TILE_THICKNESS = 0.34
export const TILE_HEIGHT = 0.82

/** Rotation that stands a lying-flat tile upright, glyph face pointing toward +Z. */
export const STANDING_ROTATION: [number, number, number] = [Math.PI / 2, 0, 0]

export interface Tile3DProps {
  kindId: TileKindId | null
  flowerKindId: FlowerKindId | null
  isFlower: boolean
  faceUp: boolean
  position: [number, number, number]
  rotation?: [number, number, number]
  onClick?: (event: { stopPropagation: () => void }) => void
  onPointerOver?: () => void
  onPointerOut?: () => void
}

/**
 * A single mahjong tile. Built lying flat by default (glyph face on local +Y,
 * footprint WIDTH x HEIGHT on the XZ plane) — this is the natural orientation
 * for wall stacks. Pass STANDING_ROTATION to stand it upright for a hand.
 */
export function Tile3D({ kindId, flowerKindId, isFlower, faceUp, position, rotation = [0, 0, 0], onClick, onPointerOver, onPointerOut }: Tile3DProps) {
  const materials = useMemo(() => {
    const body = getBodyMaterial()
    const bottom = getBottomMaterial()
    const faceTexture = faceUp ? getGlyphTexture(kindId, flowerKindId, isFlower) : getBackTexture()
    const faceMaterial = new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.5 })
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    return [body, body, faceMaterial, bottom, body, body]
  }, [kindId, flowerKindId, isFlower, faceUp])

  const spring = useSpring({
    position,
    rotation,
    config: { mass: 1, tension: 320, friction: 32 },
  })

  return (
    <AnimatedMesh
      position={spring.position as unknown as [number, number, number]}
      rotation={spring.rotation as unknown as [number, number, number]}
      material={materials}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <boxGeometry args={[TILE_WIDTH, TILE_THICKNESS, TILE_HEIGHT]} />
    </AnimatedMesh>
  )
}

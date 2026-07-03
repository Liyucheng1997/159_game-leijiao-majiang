import { useMemo } from 'react'
import * as THREE from 'three'
import { Tile3D, TILE_THICKNESS, TILE_WIDTH } from './Tile3D'

const STACKS_PER_SIDE = 18
// Half the row length (STACKS_PER_SIDE * TILE_WIDTH / 2), so the 4 sides meet
// cleanly at the corners instead of overlapping or gapping.
export const WALL_ROW_OFFSET = (STACKS_PER_SIDE * TILE_WIDTH) / 2

interface WallTileLayout {
  key: string
  position: [number, number, number]
  rotation: [number, number, number]
}

function buildWallLayout(): WallTileLayout[] {
  const layout: WallTileLayout[] = []
  const rowLength = STACKS_PER_SIDE * TILE_WIDTH
  const startX = -rowLength / 2 + TILE_WIDTH / 2
  const up = new THREE.Vector3(0, 1, 0)

  for (let side = 0; side < 4; side++) {
    const angle = side * (Math.PI / 2)
    for (let stack = 0; stack < STACKS_PER_SIDE; stack++) {
      for (let level = 0; level < 2; level++) {
        const localX = startX + stack * TILE_WIDTH
        const localY = TILE_THICKNESS / 2 + level * TILE_THICKNESS
        const localZ = WALL_ROW_OFFSET
        const v = new THREE.Vector3(localX, localY, localZ).applyAxisAngle(up, angle)
        layout.push({
          key: `wall-${side}-${stack}-${level}`,
          position: [v.x, v.y, v.z],
          rotation: [0, angle, 0],
        })
      }
    }
  }
  return layout
}

export interface Wall3DProps {
  /** How many tiles are still undrawn (wall + dead wall combined). Defaults to a full 144. */
  remainingCount?: number
}

/** The wall, arranged as 4 sides x 18 stacks x 2 tiles high, all face-down. Shrinks as tiles are drawn. */
export function Wall3D({ remainingCount = 144 }: Wall3DProps) {
  const layout = useMemo(buildWallLayout, [])
  const visible = layout.slice(0, Math.max(0, Math.min(144, remainingCount)))
  return (
    <group>
      {visible.map((tile) => (
        <Tile3D key={tile.key} kindId={null} flowerKindId={null} isFlower={false} faceUp={false} position={tile.position} rotation={tile.rotation} />
      ))}
    </group>
  )
}

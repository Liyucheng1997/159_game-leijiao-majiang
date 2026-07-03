import * as THREE from 'three'
import { Tile3D, TILE_HEIGHT, TILE_THICKNESS, TILE_WIDTH } from './Tile3D'
import type { TileInstance } from '../../engine/types'

const COLS = 6
const ROW_GAP = TILE_HEIGHT * 1.05
const COL_GAP = TILE_WIDTH * 1.05
const BASE_RADIUS = 1.15

export interface DiscardPile3DProps {
  /** 0=south(human), 1=east, 2=north, 3=west — matches Wall3D/hand side numbering. */
  seatIndex: 0 | 1 | 2 | 3
  tiles: TileInstance[]
}

/** A player's discard pond: tiles lying flat, face-up, in play order, grid-wrapped. */
export function DiscardPile3D({ seatIndex, tiles }: DiscardPile3DProps) {
  const angle = seatIndex * (Math.PI / 2)
  const up = new THREE.Vector3(0, 1, 0)
  return (
    <group>
      {tiles.map((tile, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const localX = (col - (COLS - 1) / 2) * COL_GAP
        const localZ = BASE_RADIUS + row * ROW_GAP
        const v = new THREE.Vector3(localX, TILE_THICKNESS / 2 + 0.01, localZ).applyAxisAngle(up, angle)
        return (
          <Tile3D
            key={tile.id}
            kindId={tile.kindId}
            flowerKindId={tile.flowerKindId}
            isFlower={tile.isFlower}
            faceUp
            position={[v.x, v.y, v.z]}
            rotation={[0, angle, 0]}
          />
        )
      })}
    </group>
  )
}

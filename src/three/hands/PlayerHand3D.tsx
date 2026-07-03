import { Tile3D } from '../tiles/Tile3D'
import { buildHandLayout } from './handLayout'
import type { TileInstance } from '../../engine/types'

export interface PlayerHand3DProps {
  tiles: TileInstance[]
  onTileClick?: (tileId: string) => void
}

/** The human's concealed hand: face-up, standing, arranged in a row facing the camera. */
export function PlayerHand3D({ tiles, onTileClick }: PlayerHand3DProps) {
  const layout = buildHandLayout(tiles.length, 0)
  return (
    <group>
      {tiles.map((tile, i) => (
        <Tile3D
          key={tile.id}
          kindId={tile.kindId}
          flowerKindId={tile.flowerKindId}
          isFlower={tile.isFlower}
          faceUp
          position={layout[i].position}
          rotation={layout[i].rotation}
          onClick={
            onTileClick
              ? (event) => {
                  event.stopPropagation()
                  onTileClick(tile.id)
                }
              : undefined
          }
        />
      ))}
    </group>
  )
}

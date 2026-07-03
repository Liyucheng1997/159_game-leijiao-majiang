import { Tile3D } from '../tiles/Tile3D'
import { buildHandLayout } from './handLayout'

export interface OpponentHand3DProps {
  /** 1=east, 2=north, 3=west (see buildHandLayout / Wall3D side numbering). */
  seatIndex: 1 | 2 | 3
  tileCount: number
}

/** An AI opponent's concealed hand: face-down, only the tile count is ever visible. */
export function OpponentHand3D({ seatIndex, tileCount }: OpponentHand3DProps) {
  const layout = buildHandLayout(tileCount, seatIndex)
  return (
    <group>
      {layout.map((t, i) => (
        <Tile3D key={`opp-${seatIndex}-${i}`} kindId={null} flowerKindId={null} isFlower={false} faceUp={false} position={t.position} rotation={t.rotation} />
      ))}
    </group>
  )
}

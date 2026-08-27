import { FLOWER_KIND_COUNT, TILE_KIND_COUNT } from '../engine/constants'
import { Tile } from './Tile'
import { KIND_LABELS } from './tileLabels'

/** Dev-only sheet of every tile face, reachable at ?gallery — used to eyeball the artwork. */
export function TileGallery() {
  return (
    <div style={{ background: '#256342', minHeight: '100vh', padding: 24, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {Array.from({ length: TILE_KIND_COUNT }, (_, kindId) => (
        <div key={kindId} style={{ textAlign: 'center', color: '#cfe8d8', fontSize: 12 }}>
          <Tile variant="standing" width={64} kindId={kindId} />
          <div style={{ marginTop: 4 }}>{KIND_LABELS[kindId]}</div>
        </div>
      ))}
      {Array.from({ length: FLOWER_KIND_COUNT }, (_, flowerId) => (
        <div key={`f${flowerId}`} style={{ textAlign: 'center', color: '#cfe8d8', fontSize: 12 }}>
          <Tile variant="flat" width={64} flowerKindId={flowerId} />
          <div style={{ marginTop: 4 }}>花{flowerId + 1}</div>
        </div>
      ))}
      <div style={{ textAlign: 'center', color: '#cfe8d8', fontSize: 12 }}>
        <Tile variant="backStanding" width={64} />
        <div style={{ marginTop: 4 }}>牌背</div>
      </div>
    </div>
  )
}

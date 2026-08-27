import type { GameState, Meld, PlayerIdx, TileInstance } from '../engine/types'
import { HUMAN_PLAYER_IDX, useGameStore } from '../store/gameStore'
import { selectIsHumanDiscardTurn } from '../store/selectors'
import { Tile } from './Tile'
import styles from './Board.module.css'

const WIND_CHARS = ['東', '南', '西', '北']
const SEAT_CLASSES = ['', styles.seatRight, styles.seatTop, styles.seatLeft]
const WIND_POS_CLASSES = [styles.windBottom, styles.windRight, styles.windTop, styles.windLeft]

function seatWind(seatIdx: number, dealerIdx: number): string {
  return WIND_CHARS[(seatIdx - dealerIdx + 4) % 4]
}

function MeldGroup({ meld, tileWidth }: { meld: Meld; tileWidth: string }) {
  if (meld.type === 'gang' && meld.concealed) {
    // 暗杠:两头盖着,中间亮两张
    return (
      <div className={styles.meldGroup}>
        <Tile variant="backFlat" width={tileWidth} />
        <Tile variant="flat" width={tileWidth} kindId={meld.tiles[0]} />
        <Tile variant="flat" width={tileWidth} kindId={meld.tiles[0]} />
        <Tile variant="backFlat" width={tileWidth} />
      </div>
    )
  }
  return (
    <div className={styles.meldGroup}>
      {meld.tiles.map((kindId, i) => (
        <Tile key={i} variant="flat" width={tileWidth} kindId={kindId} />
      ))}
    </div>
  )
}

function SeatLayer({ game, seatIdx }: { game: GameState; seatIdx: PlayerIdx }) {
  const player = game.players[seatIdx]
  const inFlight = game.discardInFlight?.fromPlayerIdx === seatIdx ? game.discardInFlight.tile : null
  const riverTiles: { tile: TileInstance; inFlight: boolean }[] = [
    ...player.discards.map((tile) => ({ tile, inFlight: false })),
    ...(inFlight ? [{ tile: inFlight, inFlight: true }] : []),
  ]
  const isHuman = seatIdx === HUMAN_PLAYER_IDX

  return (
    <div className={`${styles.seat} ${SEAT_CLASSES[seatIdx]}`}>
      <div className={styles.river}>
        {riverTiles.map(({ tile, inFlight: hot }, i) => (
          <Tile
            key={tile.id}
            variant="flat"
            width="var(--river-tw)"
            kindId={tile.kindId}
            flowerKindId={tile.flowerKindId}
            highlight={hot}
            className={i === riverTiles.length - 1 ? styles.riverTileIn : undefined}
          />
        ))}
      </div>
      {!isHuman && (
        <div className={styles.seatEdge}>
          <div className={styles.aiHand}>
            {player.hand.map((tile) => (
              <Tile key={tile.id} variant="backStanding" width="var(--aihand-tw)" />
            ))}
          </div>
          {player.exposedMelds.map((meld, i) => (
            <MeldGroup key={i} meld={meld} tileWidth="var(--meld-tw)" />
          ))}
          {player.flowers.length > 0 && (
            <div className={styles.flowers}>
              {player.flowers.map((flowerKindId, i) => (
                <Tile key={i} variant="flat" width="var(--flower-tw)" flowerKindId={flowerKindId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Compass({ game }: { game: GameState }) {
  const handsPlayed = useGameStore((s) => s.match.handsPlayed)
  const handsPerMatch = useGameStore((s) => s.match.handsPerMatch)
  return (
    <div className={styles.compass}>
      {([0, 1, 2, 3] as const).map((seatIdx) => {
        const isDealer = game.dealerIdx === seatIdx
        const isActive = game.currentPlayerIdx === seatIdx && game.phase !== 'HAND_OVER'
        const classes = [
          styles.windLabel,
          WIND_POS_CLASSES[seatIdx],
          isActive ? styles.windActive : '',
          isDealer ? styles.windDealer : '',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <div key={seatIdx} className={classes}>
            {seatWind(seatIdx, game.dealerIdx)}
          </div>
        )
      })}
      <div className={styles.compassCenter}>
        <span className={styles.wallCount}>{game.wall.length}</span>
        <span>
          第 {handsPlayed + 1}/{handsPerMatch} 局
        </span>
      </div>
    </div>
  )
}

function HumanHandBar({ game }: { game: GameState }) {
  const dispatch = useGameStore((s) => s.dispatch)
  const player = game.players[HUMAN_PLAYER_IDX]
  const canDiscard = selectIsHumanDiscardTurn(game)

  const drawnId = game.currentPlayerIdx === HUMAN_PLAYER_IDX ? game.justDrawnTileId : null
  const drawnTile = drawnId ? player.hand.find((t) => t.id === drawnId) ?? null : null
  const restTiles = player.hand
    .filter((t) => t.id !== drawnId)
    .slice()
    .sort((a, b) => (a.kindId ?? 99) - (b.kindId ?? 99))

  const renderHandTile = (tile: TileInstance, extraClass?: string) => (
    <Tile
      key={tile.id}
      variant="standing"
      width="var(--hand-tw)"
      kindId={tile.kindId}
      flowerKindId={tile.flowerKindId}
      clickable={canDiscard}
      dimmed={!canDiscard && game.phase !== 'HAND_OVER'}
      onClick={canDiscard ? () => dispatch({ type: 'DISCARD', tileId: tile.id }) : undefined}
      className={extraClass}
    />
  )

  return (
    <div className={styles.handBar}>
      {player.flowers.length > 0 && (
        <div className={styles.humanFlowers}>
          {player.flowers.map((flowerKindId, i) => (
            <Tile key={i} variant="flat" width="var(--flower-tw)" flowerKindId={flowerKindId} />
          ))}
        </div>
      )}
      <div className={styles.handTiles}>
        {restTiles.map((tile) => renderHandTile(tile))}
        {drawnTile && renderHandTile(drawnTile, styles.drawnTile)}
      </div>
      {player.exposedMelds.length > 0 && (
        <div className={styles.humanMelds}>
          {player.exposedMelds.map((meld, i) => (
            <MeldGroup key={i} meld={meld} tileWidth="var(--meld-tw)" />
          ))}
        </div>
      )}
    </div>
  )
}

export function Board() {
  const game = useGameStore((s) => s.match.game)
  return (
    <div className={styles.board}>
      <div className={styles.table}>
        {([0, 1, 2, 3] as const).map((seatIdx) => (
          <SeatLayer key={seatIdx} game={game} seatIdx={seatIdx} />
        ))}
        <Compass game={game} />
      </div>
      <HumanHandBar game={game} />
    </div>
  )
}

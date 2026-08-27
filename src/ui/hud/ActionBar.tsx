import { HUMAN_PLAYER_IDX, useGameStore } from '../../store/gameStore'
import { selectHumanLegalReactions, selectHumanTurnOptions } from '../../store/selectors'
import { Tile } from '../../board/Tile'
import styles from './ActionBar.module.css'

const MINI_TILE_W = 26

function MiniTiles({ kinds }: { kinds: number[] }) {
  return (
    <span className={styles.miniTiles}>
      {kinds.map((kindId, i) => (
        <Tile key={i} variant="flat" width={MINI_TILE_W} kindId={kindId} />
      ))}
    </span>
  )
}

export function ActionBar() {
  const game = useGameStore((s) => s.match.game)
  const dispatch = useGameStore((s) => s.dispatch)

  const reactions = selectHumanLegalReactions(game)
  const turnOptions = selectHumanTurnOptions(game)
  const inFlightKind = game.discardInFlight?.tile.kindId ?? null

  const hasReactionButtons = !!reactions && (reactions.hu || reactions.peng || reactions.gang || reactions.chi)
  const hasTurnButtons = turnOptions.canSelfHu || turnOptions.ankanOptions.length > 0 || turnOptions.jiagangOptions.length > 0

  if (!hasReactionButtons && !hasTurnButtons) return null

  return (
    <div className={styles.bar}>
      {reactions?.hu && (
        <button className={styles.hu} onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'hu' })}>
          胡
        </button>
      )}
      {turnOptions.canSelfHu && (
        <button className={styles.hu} onClick={() => dispatch({ type: 'SELF_HU' })}>
          自摸
        </button>
      )}
      {reactions?.gang && inFlightKind !== null && (
        <button onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'gang' })}>
          杠
          <MiniTiles kinds={[inFlightKind, inFlightKind, inFlightKind, inFlightKind]} />
        </button>
      )}
      {reactions?.peng && inFlightKind !== null && (
        <button onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'peng' })}>
          碰
          <MiniTiles kinds={[inFlightKind, inFlightKind, inFlightKind]} />
        </button>
      )}
      {reactions?.chi &&
        inFlightKind !== null &&
        reactions.chiOptions.map((pair) => (
          <button
            key={`chi-${pair[0]}-${pair[1]}`}
            onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'chi', chiPartner: pair })}
          >
            吃
            <MiniTiles kinds={[...pair, inFlightKind].sort((a, b) => a - b)} />
          </button>
        ))}
      {turnOptions.ankanOptions.map((kindId) => (
        <button key={`ankan-${kindId}`} onClick={() => dispatch({ type: 'ANKAN', kindId })}>
          暗杠
          <MiniTiles kinds={[kindId]} />
        </button>
      ))}
      {turnOptions.jiagangOptions.map((kindId) => (
        <button key={`jiagang-${kindId}`} onClick={() => dispatch({ type: 'JIAGANG', kindId })}>
          加杠
          <MiniTiles kinds={[kindId]} />
        </button>
      ))}
      {hasReactionButtons && (
        <button className={styles.pass} onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'pass' })}>
          过
        </button>
      )}
    </div>
  )
}

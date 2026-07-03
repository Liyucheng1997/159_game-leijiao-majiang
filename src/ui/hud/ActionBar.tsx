import { HUMAN_PLAYER_IDX, useGameStore } from '../../store/gameStore'
import { selectHumanLegalReactions, selectHumanTurnOptions } from '../../store/selectors'
import styles from './ActionBar.module.css'

export function ActionBar() {
  const game = useGameStore((s) => s.match.game)
  const dispatch = useGameStore((s) => s.dispatch)

  const reactions = selectHumanLegalReactions(game)
  const turnOptions = selectHumanTurnOptions(game)

  const hasReactionButtons = !!reactions && (reactions.hu || reactions.peng || reactions.gang || reactions.chi)
  const hasTurnButtons = turnOptions.canSelfHu || turnOptions.ankanOptions.length > 0 || turnOptions.jiagangOptions.length > 0

  if (!hasReactionButtons && !hasTurnButtons) return null

  return (
    <div className={styles.bar}>
      {reactions?.hu && <button onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'hu' })}>胡</button>}
      {reactions?.gang && <button onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'gang' })}>杠</button>}
      {reactions?.peng && <button onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'peng' })}>碰</button>}
      {reactions?.chi && (
        <button onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'chi', chiPartner: reactions.chiOptions[0] })}>吃</button>
      )}
      {hasReactionButtons && (
        <button className={styles.pass} onClick={() => dispatch({ type: 'REACT', playerIdx: HUMAN_PLAYER_IDX, choice: 'pass' })}>
          过
        </button>
      )}
      {turnOptions.canSelfHu && <button onClick={() => dispatch({ type: 'SELF_HU' })}>自摸</button>}
      {turnOptions.ankanOptions.map((kindId) => (
        <button key={`ankan-${kindId}`} onClick={() => dispatch({ type: 'ANKAN', kindId })}>
          暗杠
        </button>
      ))}
      {turnOptions.jiagangOptions.map((kindId) => (
        <button key={`jiagang-${kindId}`} onClick={() => dispatch({ type: 'JIAGANG', kindId })}>
          加杠
        </button>
      ))}
    </div>
  )
}

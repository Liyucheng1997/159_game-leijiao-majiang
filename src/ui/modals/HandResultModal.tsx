import { isMatchOver } from '../../engine/match'
import { useGameStore } from '../../store/gameStore'
import { SEAT_NAMES } from '../seatNames'
import styles from './HandResultModal.module.css'

export function HandResultModal() {
  const game = useGameStore((s) => s.match.game)
  const match = useGameStore((s) => s.match)
  const advanceHand = useGameStore((s) => s.advanceHand)
  const startNewMatch = useGameStore((s) => s.startNewMatch)

  if (game.phase !== 'HAND_OVER' || !game.handResult) return null
  const result = game.handResult
  const matchDone = isMatchOver(match)

  const ranking = matchDone
    ? [0, 1, 2, 3]
        .map((seat) => ({ seat, score: match.scores[seat] }))
        .sort((a, b) => b.score - a.score)
    : null

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {result.winnerIdx === null ? (
          <h2>流局</h2>
        ) : (
          <>
            <h2>
              {result.isSelfDraw ? '自摸' : '点炮'} — {SEAT_NAMES[result.winnerIdx]} 胡牌
            </h2>
            <ul>
              {result.fanResult?.breakdown.map((entry) => (
                <li key={entry.name}>
                  {entry.name} +{entry.fan}番
                </li>
              ))}
            </ul>
            <p>共 {result.fanResult?.total} 番</p>
          </>
        )}

        {matchDone && ranking ? (
          <>
            <h2>本场结束</h2>
            <ul>
              {ranking.map((entry, i) => (
                <li key={entry.seat}>
                  {i + 1}. {SEAT_NAMES[entry.seat]} — {entry.score}
                </li>
              ))}
            </ul>
            <button onClick={() => startNewMatch()}>开始新一场</button>
          </>
        ) : (
          <>
            <p>当前比分：{[0, 1, 2, 3].map((seat) => `${SEAT_NAMES[seat]} ${match.scores[seat]}`).join(' / ')}</p>
            <button onClick={() => advanceHand()}>下一局</button>
          </>
        )}
      </div>
    </div>
  )
}

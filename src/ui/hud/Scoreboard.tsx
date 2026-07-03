import { useGameStore } from '../../store/gameStore'
import { SEAT_NAMES } from '../seatNames'
import styles from './Scoreboard.module.css'

export function Scoreboard() {
  const scores = useGameStore((s) => s.match.scores)
  const dealerIdx = useGameStore((s) => s.match.dealerIdx)
  const handsPlayed = useGameStore((s) => s.match.handsPlayed)
  const handsPerMatch = useGameStore((s) => s.match.handsPerMatch)
  const wallCount = useGameStore((s) => s.match.game.wall.length)

  return (
    <div className={styles.board}>
      <div className={styles.wallCount}>
        第 {handsPlayed + 1}/{handsPerMatch} 局 · 剩余 {wallCount} 张
      </div>
      {[0, 1, 2, 3].map((seat) => (
        <div key={seat} className={styles.row}>
          {dealerIdx === seat && <span className={styles.dealerBadge}>庄</span>}
          <span>{SEAT_NAMES[seat]}</span>
          <span>{scores[seat]}</span>
        </div>
      ))}
    </div>
  )
}

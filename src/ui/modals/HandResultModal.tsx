import { Tile } from '../../board/Tile'
import { isMatchOver } from '../../engine/match'
import type { GameState } from '../../engine/types'
import { useGameStore } from '../../store/gameStore'
import { SEAT_NAMES } from '../seatNames'
import styles from './HandResultModal.module.css'

const TILE_W = 34
const MELD_TILE_W = 30

/** The winner's revealed hand: concealed tiles sorted, winning tile pulled out and highlighted. */
function WinningHand({ game }: { game: GameState }) {
  const result = game.handResult
  if (!result || result.winnerIdx === null || result.winningTile === null) return null
  const winner = game.players[result.winnerIdx]

  const kinds = winner.hand
    .filter((t) => !t.isFlower && t.kindId !== null)
    .map((t) => t.kindId as number)
    .sort((a, b) => a - b)

  // 自摸时胡的牌已在手里,取出一张单独展示;点炮时本就不在手里。
  if (result.isSelfDraw) {
    const idx = kinds.indexOf(result.winningTile)
    if (idx >= 0) kinds.splice(idx, 1)
  }

  return (
    <div className={styles.winningHand}>
      {winner.exposedMelds.map((meld, i) => (
        <span key={`m${i}`} className={styles.meldGroup}>
          {meld.type === 'gang' && meld.concealed ? (
            <>
              <Tile variant="backFlat" width={MELD_TILE_W} />
              <Tile variant="flat" width={MELD_TILE_W} kindId={meld.tiles[0]} />
              <Tile variant="flat" width={MELD_TILE_W} kindId={meld.tiles[0]} />
              <Tile variant="backFlat" width={MELD_TILE_W} />
            </>
          ) : (
            meld.tiles.map((kindId, j) => <Tile key={j} variant="flat" width={MELD_TILE_W} kindId={kindId} />)
          )}
        </span>
      ))}
      <span className={styles.concealedGroup}>
        {kinds.map((kindId, i) => (
          <Tile key={i} variant="flat" width={TILE_W} kindId={kindId} />
        ))}
      </span>
      <span className={styles.winningTile}>
        <Tile variant="flat" width={TILE_W} kindId={result.winningTile} highlight />
      </span>
    </div>
  )
}

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
            <WinningHand game={game} />
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

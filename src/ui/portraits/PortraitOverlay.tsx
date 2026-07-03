import { calcShanten } from '../../engine/shanten'
import { countVectorFromHand } from '../../engine/tiles'
import type { GameState, PlayerIdx } from '../../engine/types'
import { useGameStore } from '../../store/gameStore'
import { CHARACTER_PROFILES } from './portraitAssets'
import type { Mood } from './portraitAssets'
import { PortraitCard } from './PortraitCard'
import styles from './PortraitOverlay.module.css'

const WALL_LOW_THRESHOLD = 20
const WORRIED_SHANTEN_THRESHOLD = 3

function deriveMood(game: GameState, playerIdx: PlayerIdx): Mood {
  if (game.phase === 'HAND_OVER' && game.handResult?.winnerIdx === playerIdx) return 'happy'
  if (game.currentPlayerIdx === playerIdx && (game.phase === 'AWAITING_DRAW' || game.phase === 'AWAITING_DISCARD')) {
    return 'discarding'
  }
  const player = game.players[playerIdx]
  const shanten = calcShanten(countVectorFromHand(player.hand), player.exposedMelds.length).shanten
  if (shanten >= WORRIED_SHANTEN_THRESHOLD && game.wall.length < WALL_LOW_THRESHOLD) return 'worried'
  return 'neutral'
}

const SEAT_CLASS = { 1: styles.seatEast, 2: styles.seatNorth, 3: styles.seatWest } as const

export function PortraitOverlay() {
  const game = useGameStore((s) => s.match.game)
  const scores = useGameStore((s) => s.match.scores)
  const dealerIdx = useGameStore((s) => s.match.dealerIdx)

  return (
    <>
      {([1, 2, 3] as const).map((seatIndex) => {
        const profile = CHARACTER_PROFILES[seatIndex]
        return (
          <div key={seatIndex} className={SEAT_CLASS[seatIndex]}>
            <PortraitCard
              characterId={profile.id}
              name={profile.name}
              accentColor={profile.accentColor}
              hairColor={profile.hairColor}
              mood={deriveMood(game, seatIndex)}
              score={scores[seatIndex]}
              isDealer={dealerIdx === seatIndex}
              isCurrentTurn={game.currentPlayerIdx === seatIndex}
            />
          </div>
        )
      })}
    </>
  )
}

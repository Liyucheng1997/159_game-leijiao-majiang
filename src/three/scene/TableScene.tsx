import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { TableSurface } from './TableSurface'
import { DiceRoller } from './DiceRoller'
import { Wall3D } from '../tiles/Wall3D'
import { PlayerHand3D } from '../hands/PlayerHand3D'
import { OpponentHand3D } from '../hands/OpponentHand3D'
import { DiscardPile3D } from '../tiles/DiscardPile3D'
import { HUMAN_PLAYER_IDX, useGameStore } from '../../store/gameStore'
import { selectIsHumanDiscardTurn } from '../../store/selectors'

export function TableScene() {
  const game = useGameStore((s) => s.match.game)
  const handsPlayed = useGameStore((s) => s.match.handsPlayed)
  const dispatch = useGameStore((s) => s.dispatch)
  const canDiscard = selectIsHumanDiscardTurn(game)
  const humanPlayer = game.players[HUMAN_PLAYER_IDX]
  const wallRemaining = game.wall.length + game.deadWall.length

  return (
    <Canvas shadows>
      <color attach="background" args={['#0b0e10']} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 9, 5]} intensity={1.1} castShadow />
      <directionalLight position={[-4, 6, -5]} intensity={0.4} />
      <CameraRig />
      <TableSurface />
      <Wall3D remainingCount={wallRemaining} />
      <DiceRoller key={handsPlayed} handKey={handsPlayed} />
      <PlayerHand3D tiles={humanPlayer.hand} onTileClick={canDiscard ? (tileId) => dispatch({ type: 'DISCARD', tileId }) : undefined} />
      <OpponentHand3D seatIndex={1} tileCount={game.players[1].hand.length} />
      <OpponentHand3D seatIndex={2} tileCount={game.players[2].hand.length} />
      <OpponentHand3D seatIndex={3} tileCount={game.players[3].hand.length} />
      <DiscardPile3D seatIndex={0} tiles={humanPlayer.discards} />
      <DiscardPile3D seatIndex={1} tiles={game.players[1].discards} />
      <DiscardPile3D seatIndex={2} tiles={game.players[2].discards} />
      <DiscardPile3D seatIndex={3} tiles={game.players[3].discards} />
    </Canvas>
  )
}

import { getPortraitSrc, type Mood } from './portraitAssets'
import { PortraitSvg } from './PortraitSvg'
import styles from './PortraitCard.module.css'

export interface PortraitCardProps {
  characterId: string
  name: string
  accentColor: string
  hairColor: string
  mood: Mood
  score: number
  isDealer: boolean
  isCurrentTurn: boolean
}

export function PortraitCard({ characterId, name, accentColor, hairColor, mood, score, isDealer, isCurrentTurn }: PortraitCardProps) {
  const source = getPortraitSrc(characterId, mood)
  return (
    <div className={isCurrentTurn ? `${styles.card} ${styles.active}` : styles.card}>
      <div className={styles.portraitWrap}>
        {source.type === 'image' ? (
          <img src={source.src} alt={name} width="100%" height="100%" />
        ) : (
          <PortraitSvg accentColor={accentColor} hairColor={hairColor} mood={mood} />
        )}
        {isDealer && <span className={styles.dealerBadge}>庄</span>}
      </div>
      <div className={styles.name}>{name}</div>
      <div className={styles.score}>{score}</div>
    </div>
  )
}

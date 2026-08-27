import type { CSSProperties } from 'react'
import type { FlowerKindId, TileKindId } from '../engine/types'
import { FACE_H, FACE_W, FlowerFaceArt, TileFaceArt } from './tileArt'
import styles from './Tile.module.css'

export type TileVariant = 'standing' | 'flat' | 'backStanding' | 'backFlat'

export interface TileProps {
  variant: TileVariant
  /** Tile width: px number or any CSS length; height derives from the real-tile aspect ratio. */
  width: number | string
  kindId?: TileKindId | null
  flowerKindId?: FlowerKindId | null
  onClick?: () => void
  clickable?: boolean
  dimmed?: boolean
  highlight?: boolean
  className?: string
  title?: string
}

export function Tile({
  variant,
  width,
  kindId = null,
  flowerKindId = null,
  onClick,
  clickable = false,
  dimmed = false,
  highlight = false,
  className,
  title,
}: TileProps) {
  const style = { '--tw': typeof width === 'number' ? `${width}px` : width } as CSSProperties
  const showFace = variant === 'standing' || variant === 'flat'

  const face = showFace ? (
    <svg className={styles.faceSvg} viewBox={`0 0 ${FACE_W} ${FACE_H}`} aria-hidden>
      {flowerKindId !== null ? (
        <FlowerFaceArt flowerKindId={flowerKindId} />
      ) : kindId !== null ? (
        <TileFaceArt kindId={kindId} />
      ) : null}
    </svg>
  ) : null

  const classes = [
    styles.tile,
    styles[variant],
    clickable ? styles.clickable : '',
    dimmed ? styles.dimmed : '',
    highlight ? styles.highlight : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  if (variant === 'standing') {
    return (
      <div className={classes} style={style} onClick={onClick} title={title}>
        <div className={styles.standingBackStrip} />
        <div className={styles.standingFace}>{face}</div>
      </div>
    )
  }

  return (
    <div className={classes} style={style} onClick={onClick} title={title}>
      {face}
    </div>
  )
}

import type { Mood } from './portraitAssets'

export interface PortraitSvgProps {
  accentColor: string
  hairColor: string
  mood: Mood
}

const MOUTH_PATHS: Record<Mood, string> = {
  happy: 'M 35 62 Q 50 74 65 62',
  worried: 'M 35 67 Q 50 58 65 67',
  discarding: 'M 38 63 Q 50 69 62 63',
  neutral: 'M 38 63 Q 50 66 62 63',
}

const EYE_HEIGHT: Record<Mood, number> = {
  happy: 2.5,
  worried: 5,
  discarding: 4,
  neutral: 4,
}

/** Tasteful, fully abstract/geometric bust portrait — a placeholder for real character art. */
export function PortraitSvg({ accentColor, hairColor, mood }: PortraitSvgProps) {
  const eyeHeight = EYE_HEIGHT[mood]
  return (
    <svg viewBox="0 0 100 110" width="100%" height="100%" role="img" aria-label="character portrait">
      <rect x="0" y="0" width="100" height="110" fill="#f6ede1" rx="10" />
      <path d="M 6 112 Q 50 78 94 112 L 94 112 L 6 112 Z" fill={accentColor} />
      <rect x="42" y="55" width="16" height="18" fill="#f1c9a8" />
      <circle cx="50" cy="42" r="26" fill="#f7d3b0" />
      <path d="M 24 40 Q 20 5 50 8 Q 80 5 76 40 Q 76 18 50 18 Q 24 18 24 40 Z" fill={hairColor} />
      <ellipse cx="40" cy="42" rx="3" ry={eyeHeight} fill="#2b2b2b" />
      <ellipse cx="60" cy="42" rx="3" ry={eyeHeight} fill="#2b2b2b" />
      <path d={MOUTH_PATHS[mood]} stroke="#8a4a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {mood === 'worried' && <path d="M 72 28 Q 76 35 72 40 Q 68 35 72 28 Z" fill="#7fc7e8" />}
    </svg>
  )
}

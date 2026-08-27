import type { FlowerKindId, TileKindId } from '../engine/types'
import { NUMERALS } from './tileLabels'

/**
 * Hand-drawn SVG faces for every tile kind, styled after real engraved
 * bone/bamboo mahjong tiles: blue numerals + red 萬, ringed 筒 dots,
 * bamboo-stick 条 (with the classic bird on 1条), calligraphic honors.
 * All faces share the 60x80 viewBox; the tile chrome scales them.
 */

export const FACE_W = 60
export const FACE_H = 80

const BLUE = '#20509e'
const RED = '#c8322b'
const GREEN = '#20713c'

const KAI_FONT = '"KaiTi","STKaiti","Kaiti SC","Kaiti TC","DFKai-SB","BiauKai","楷体",serif'

function CalligraphyText({
  text,
  x,
  y,
  size,
  color,
  stretch,
}: {
  text: string
  x: number
  y: number
  size: number
  color: string
  stretch?: number
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={color}
      fontFamily={KAI_FONT}
      fontWeight={700}
      textAnchor="middle"
      dominantBaseline="central"
      transform={stretch ? `scale(1 ${stretch})` : undefined}
      style={{ userSelect: 'none' }}
    >
      {text}
    </text>
  )
}

/* ---------------------------------- 万 ---------------------------------- */

function WanFace({ rank }: { rank: number }) {
  return (
    <g>
      <CalligraphyText text={NUMERALS[rank - 1]} x={30} y={21} size={30} color={BLUE} />
      <CalligraphyText text="萬" x={30} y={55} size={37} color={RED} />
    </g>
  )
}

/* ---------------------------------- 筒 ---------------------------------- */

function Dot({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={r * 0.3} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={color} strokeWidth={r * 0.14} opacity={0.55} />
      <circle cx={cx} cy={cy} r={r * 0.34} fill={color} />
    </g>
  )
}

/** The ornate single big circle of 1筒. */
function BigDot() {
  const petals = []
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const cx = 30 + Math.cos(a) * 16.5
    const cy = 40 + Math.sin(a) * 16.5
    petals.push(<circle key={i} cx={cx} cy={cy} r={3.1} fill={i % 2 === 0 ? RED : GREEN} />)
  }
  return (
    <g>
      <circle cx={30} cy={40} r={24} fill="none" stroke={BLUE} strokeWidth={2.6} />
      <circle cx={30} cy={40} r={20.5} fill="none" stroke={BLUE} strokeWidth={1.1} opacity={0.6} />
      {petals}
      <circle cx={30} cy={40} r={10.5} fill="none" stroke={RED} strokeWidth={2.4} />
      <circle cx={30} cy={40} r={6.2} fill="none" stroke={GREEN} strokeWidth={1.6} />
      <circle cx={30} cy={40} r={2.6} fill={RED} />
    </g>
  )
}

interface DotSpec {
  cx: number
  cy: number
  r: number
  color: string
}

const TONG_LAYOUTS: Record<number, DotSpec[]> = {
  2: [
    { cx: 30, cy: 23, r: 11, color: BLUE },
    { cx: 30, cy: 57, r: 11, color: GREEN },
  ],
  3: [
    { cx: 16, cy: 18, r: 9, color: BLUE },
    { cx: 30, cy: 40, r: 9, color: RED },
    { cx: 44, cy: 62, r: 9, color: GREEN },
  ],
  4: [
    { cx: 18.5, cy: 23, r: 9.5, color: BLUE },
    { cx: 41.5, cy: 23, r: 9.5, color: GREEN },
    { cx: 18.5, cy: 57, r: 9.5, color: GREEN },
    { cx: 41.5, cy: 57, r: 9.5, color: BLUE },
  ],
  5: [
    { cx: 17, cy: 21, r: 8.2, color: BLUE },
    { cx: 43, cy: 21, r: 8.2, color: GREEN },
    { cx: 30, cy: 40, r: 8.2, color: RED },
    { cx: 17, cy: 59, r: 8.2, color: GREEN },
    { cx: 43, cy: 59, r: 8.2, color: BLUE },
  ],
  6: [
    { cx: 19, cy: 19, r: 8, color: GREEN },
    { cx: 41, cy: 19, r: 8, color: GREEN },
    { cx: 19, cy: 40, r: 8, color: RED },
    { cx: 41, cy: 40, r: 8, color: RED },
    { cx: 19, cy: 61, r: 8, color: RED },
    { cx: 41, cy: 61, r: 8, color: RED },
  ],
  7: [
    { cx: 14, cy: 14, r: 6.8, color: GREEN },
    { cx: 30, cy: 19, r: 6.8, color: GREEN },
    { cx: 46, cy: 24, r: 6.8, color: GREEN },
    { cx: 19, cy: 43, r: 7.2, color: RED },
    { cx: 41, cy: 43, r: 7.2, color: RED },
    { cx: 19, cy: 63, r: 7.2, color: RED },
    { cx: 41, cy: 63, r: 7.2, color: RED },
  ],
  8: [
    { cx: 19, cy: 14.5, r: 7, color: BLUE },
    { cx: 41, cy: 14.5, r: 7, color: BLUE },
    { cx: 19, cy: 31.5, r: 7, color: BLUE },
    { cx: 41, cy: 31.5, r: 7, color: BLUE },
    { cx: 19, cy: 48.5, r: 7, color: BLUE },
    { cx: 41, cy: 48.5, r: 7, color: BLUE },
    { cx: 19, cy: 65.5, r: 7, color: BLUE },
    { cx: 41, cy: 65.5, r: 7, color: BLUE },
  ],
  9: [
    { cx: 15, cy: 17, r: 6.6, color: BLUE },
    { cx: 30, cy: 17, r: 6.6, color: BLUE },
    { cx: 45, cy: 17, r: 6.6, color: BLUE },
    { cx: 15, cy: 40, r: 6.6, color: RED },
    { cx: 30, cy: 40, r: 6.6, color: RED },
    { cx: 45, cy: 40, r: 6.6, color: RED },
    { cx: 15, cy: 63, r: 6.6, color: GREEN },
    { cx: 30, cy: 63, r: 6.6, color: GREEN },
    { cx: 45, cy: 63, r: 6.6, color: GREEN },
  ],
}

function TongFace({ rank }: { rank: number }) {
  if (rank === 1) return <BigDot />
  return (
    <g>
      {TONG_LAYOUTS[rank].map((d, i) => (
        <Dot key={i} {...d} />
      ))}
    </g>
  )
}

/* ---------------------------------- 条 ---------------------------------- */

/** One engraved bamboo stick centered at (cx, cy). */
function Stick({
  cx,
  cy,
  h,
  color,
  rot,
}: {
  cx: number
  cy: number
  h: number
  color: string
  rot?: number
}) {
  const w = h * 0.42
  const seg = h / 2 - 1
  return (
    <g transform={`translate(${cx} ${cy})${rot ? ` rotate(${rot})` : ''}`}>
      {/* two bamboo segments, wider at the joint */}
      <path
        d={`M ${-w / 2} ${-seg} Q 0 ${-seg - 2.5} ${w / 2} ${-seg} L ${w * 0.36} -1 L ${-w * 0.36} -1 Z`}
        fill={color}
      />
      <path
        d={`M ${-w * 0.36} 1 L ${w * 0.36} 1 L ${w / 2} ${seg} Q 0 ${seg + 2.5} ${-w / 2} ${seg} Z`}
        fill={color}
      />
      {/* joint band */}
      <rect x={-w * 0.46} y={-1.1} width={w * 0.92} height={2.2} rx={1} fill={color} opacity={0.65} />
    </g>
  )
}

/** The classic sparrow/peacock on 1条, perched and facing left. */
function BirdFace() {
  return (
    <g>
      {/* tail plumes */}
      <path d="M 34 42 C 44 34 50 24 51 13 C 46 20 40 26 33 31" fill="none" stroke={GREEN} strokeWidth={3.4} strokeLinecap="round" />
      <path d="M 35 44 C 47 40 53 33 56 24 C 50 30 43 34 35 37" fill="none" stroke={BLUE} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M 36 47 C 48 47 55 43 58 37 C 52 40 44 41 36 41" fill="none" stroke={RED} strokeWidth={3} strokeLinecap="round" />
      {/* body */}
      <path d="M 20 28 C 12 32 10 44 14 52 C 18 60 30 62 36 56 C 41 51 40 40 34 33 C 30 28 24 26 20 28 Z" fill={GREEN} />
      {/* wing */}
      <path d="M 24 38 C 30 38 35 43 35 50 C 30 51 24 48 22 43 Z" fill={RED} opacity={0.9} />
      {/* head */}
      <circle cx={18} cy={24} r={7.5} fill={GREEN} />
      {/* crest */}
      <path d="M 16 17 C 14 12 17 9 21 8 C 19 12 20 15 21 17 Z" fill={RED} />
      {/* beak */}
      <path d="M 11 23 L 3 27 L 11 29 Z" fill={RED} />
      {/* eye */}
      <circle cx={17.5} cy={23} r={2.4} fill="#fff" />
      <circle cx={17} cy={23} r={1.2} fill="#222" />
      {/* legs + perch */}
      <path d="M 22 60 L 20 68 M 28 61 L 28 68" stroke={RED} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <path d="M 10 70 L 50 70" stroke={GREEN} strokeWidth={2.6} strokeLinecap="round" />
    </g>
  )
}

interface StickSpec {
  cx: number
  cy: number
  h: number
  color: string
  rot?: number
}

const TIAO_LAYOUTS: Record<number, StickSpec[]> = {
  2: [
    { cx: 30, cy: 22, h: 26, color: BLUE },
    { cx: 30, cy: 58, h: 26, color: GREEN },
  ],
  3: [
    { cx: 30, cy: 20, h: 24, color: BLUE },
    { cx: 18, cy: 57, h: 24, color: GREEN },
    { cx: 42, cy: 57, h: 24, color: GREEN },
  ],
  4: [
    { cx: 18, cy: 22, h: 24, color: BLUE },
    { cx: 42, cy: 22, h: 24, color: GREEN },
    { cx: 18, cy: 58, h: 24, color: GREEN },
    { cx: 42, cy: 58, h: 24, color: BLUE },
  ],
  5: [
    { cx: 17, cy: 20, h: 22, color: GREEN },
    { cx: 43, cy: 20, h: 22, color: BLUE },
    { cx: 30, cy: 40, h: 22, color: RED },
    { cx: 17, cy: 60, h: 22, color: BLUE },
    { cx: 43, cy: 60, h: 22, color: GREEN },
  ],
  6: [
    { cx: 15, cy: 22, h: 22, color: GREEN },
    { cx: 30, cy: 22, h: 22, color: GREEN },
    { cx: 45, cy: 22, h: 22, color: GREEN },
    { cx: 15, cy: 58, h: 22, color: BLUE },
    { cx: 30, cy: 58, h: 22, color: BLUE },
    { cx: 45, cy: 58, h: 22, color: BLUE },
  ],
  7: [
    { cx: 30, cy: 15, h: 19, color: RED },
    { cx: 15, cy: 41, h: 19, color: GREEN },
    { cx: 30, cy: 41, h: 19, color: GREEN },
    { cx: 45, cy: 41, h: 19, color: GREEN },
    { cx: 15, cy: 64, h: 19, color: BLUE },
    { cx: 30, cy: 64, h: 19, color: BLUE },
    { cx: 45, cy: 64, h: 19, color: BLUE },
  ],
  8: [
    // top ∧ chevron
    { cx: 18, cy: 21, h: 18, color: GREEN, rot: 32 },
    { cx: 27, cy: 27, h: 18, color: GREEN, rot: 32 },
    { cx: 42, cy: 21, h: 18, color: GREEN, rot: -32 },
    { cx: 33, cy: 27, h: 18, color: GREEN, rot: -32 },
    // bottom ∨ chevron
    { cx: 18, cy: 59, h: 18, color: BLUE, rot: -32 },
    { cx: 27, cy: 53, h: 18, color: BLUE, rot: -32 },
    { cx: 42, cy: 59, h: 18, color: BLUE, rot: 32 },
    { cx: 33, cy: 53, h: 18, color: BLUE, rot: 32 },
  ],
  9: [
    { cx: 15, cy: 18, h: 19, color: GREEN },
    { cx: 30, cy: 18, h: 19, color: GREEN },
    { cx: 45, cy: 18, h: 19, color: GREEN },
    { cx: 15, cy: 40, h: 19, color: RED },
    { cx: 30, cy: 40, h: 19, color: RED },
    { cx: 45, cy: 40, h: 19, color: RED },
    { cx: 15, cy: 62, h: 19, color: BLUE },
    { cx: 30, cy: 62, h: 19, color: BLUE },
    { cx: 45, cy: 62, h: 19, color: BLUE },
  ],
}

function TiaoFace({ rank }: { rank: number }) {
  if (rank === 1) return <BirdFace />
  return (
    <g>
      {TIAO_LAYOUTS[rank].map((s, i) => (
        <Stick key={i} {...s} />
      ))}
    </g>
  )
}

/* ------------------------------- 风 & 箭牌 ------------------------------- */

const WIND_CHARS = ['東', '南', '西', '北']

function WindFace({ idx }: { idx: number }) {
  return <CalligraphyText text={WIND_CHARS[idx]} x={30} y={41} size={44} color={BLUE} />
}

function DragonFace({ idx }: { idx: number }) {
  if (idx === 0) return <CalligraphyText text="中" x={30} y={41} size={48} color={RED} />
  if (idx === 1) return <CalligraphyText text="發" x={30} y={41} size={44} color={GREEN} />
  // 白板: the double blue frame
  return (
    <g>
      <rect x={10} y={10} width={40} height={60} rx={2.5} fill="none" stroke={BLUE} strokeWidth={3.4} />
      <rect x={17} y={17} width={26} height={46} rx={1.5} fill="none" stroke={BLUE} strokeWidth={1.8} />
    </g>
  )
}

/* ---------------------------------- 花牌 ---------------------------------- */

const FLOWER_DEFS: { char: string; num: string; color: string }[] = [
  { char: '春', num: '一', color: RED },
  { char: '夏', num: '二', color: RED },
  { char: '秋', num: '三', color: RED },
  { char: '冬', num: '四', color: RED },
  { char: '梅', num: '一', color: BLUE },
  { char: '蘭', num: '二', color: BLUE },
  { char: '竹', num: '三', color: BLUE },
  { char: '菊', num: '四', color: BLUE },
]

export function FlowerFaceArt({ flowerKindId }: { flowerKindId: FlowerKindId }) {
  const def = FLOWER_DEFS[flowerKindId]
  return (
    <g>
      <CalligraphyText text={def.num} x={13} y={13} size={13} color={def.color === RED ? BLUE : RED} />
      <CalligraphyText text={def.char} x={30} y={46} size={38} color={def.color} />
    </g>
  )
}

/* --------------------------------- 入口 --------------------------------- */

export function TileFaceArt({ kindId }: { kindId: TileKindId }) {
  if (kindId < 9) return <WanFace rank={kindId + 1} />
  if (kindId < 18) return <TiaoFace rank={kindId - 9 + 1} />
  if (kindId < 27) return <TongFace rank={kindId - 18 + 1} />
  if (kindId < 31) return <WindFace idx={kindId - 27} />
  return <DragonFace idx={kindId - 31} />
}


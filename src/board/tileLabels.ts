/** 牌名数据,供牌面绘制、画廊和语音报牌共用(无任何依赖)。 */

export const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

export const KIND_LABELS: string[] = [
  ...NUMERALS.map((n) => `${n}万`),
  ...NUMERALS.map((n) => `${n}条`),
  ...NUMERALS.map((n) => `${n}筒`),
  '东风',
  '南风',
  '西风',
  '北风',
  '红中',
  '发财',
  '白板',
]

/** 从 TileInstance.id(buildDeck 里的 `k{kind}-{copy}` 格式)解析牌名;花牌等返回 null。 */
export function labelFromTileId(tileId: string): string | null {
  const match = /^k(\d+)-/.exec(tileId)
  if (!match) return null
  return KIND_LABELS[Number(match[1])] ?? null
}

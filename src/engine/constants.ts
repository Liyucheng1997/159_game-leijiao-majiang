export const TILE_KIND_COUNT = 34
export const FLOWER_KIND_COUNT = 8

export const WAN_START = 0
export const TIAO_START = 9
export const TONG_START = 18
export const WIND_START = 27
export const DRAGON_START = 31
export const HONOR_START = WIND_START

/** The 13 kinds required for 十三幺: terminal (1/9) of each suit + all 7 honors. */
export const TERMINAL_HONOR_INDICES = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]

export const HAND_SIZE = 13
export const DEAD_WALL_SIZE = 14

/** 十三幺 overrides normal fan summation and is treated as this fixed max value. */
export const MAX_FAN = 88

export const SELF_DRAW_MIN_FAN = 1
export const DISCARD_WIN_MIN_FAN = 2

export const DEFAULT_BASE_UNIT = 10
export const DEFAULT_HANDS_PER_MATCH = 16

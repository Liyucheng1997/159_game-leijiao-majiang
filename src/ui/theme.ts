/** 牌桌主题:通过 <html data-theme> + CSS 变量整体换肤,牌面雕刻色保持不变。 */

export interface ThemeDef {
  id: string
  label: string
  /** 设置弹窗里色卡预览用的两个代表色:桌布 / 牌背 */
  feltSwatch: string
  backSwatch: string
}

export const THEMES: ThemeDef[] = [
  { id: 'classic', label: '翠绿经典', feltSwatch: '#226342', backSwatch: '#2e7d55' },
  { id: 'crystal', label: '冰蓝水晶', feltSwatch: '#1e3358', backSwatch: '#3f9dd0' },
  { id: 'rosewood', label: '红木朱砂', feltSwatch: '#6e3a20', backSwatch: '#93332b' },
  { id: 'night', label: '墨玉夜色', feltSwatch: '#161f1b', backSwatch: '#183226' },
]

const STORAGE_KEY = 'leijiao-theme'

export function loadTheme(): string {
  if (typeof window !== 'undefined') {
    // 调试用:?theme=crystal 直接指定
    const fromUrl = new URLSearchParams(window.location.search).get('theme')
    if (fromUrl && THEMES.some((t) => t.id === fromUrl)) return fromUrl
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && THEMES.some((t) => t.id === saved)) return saved
    } catch {
      /* ignore */
    }
  }
  return 'classic'
}

export function applyTheme(id: string) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = id
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

import { useState } from 'react'
import { soundManager } from '../../audio/soundManager'
import type { AudioSettings } from '../../audio/soundManager'
import { DEFAULT_BASE_UNIT, DEFAULT_HANDS_PER_MATCH } from '../../engine/constants'
import { useGameStore } from '../../store/gameStore'
import { applyTheme, loadTheme, THEMES } from '../theme'
import styles from './SettingsModal.module.css'

const AUDIO_OPTIONS: { key: keyof AudioSettings; label: string }[] = [
  { key: 'sfx', label: '打牌音效' },
  { key: 'voice', label: '语音报牌（吃/碰/杠/胡）' },
  { key: 'music', label: '背景音乐' },
]

export function SettingsModal() {
  const [open, setOpen] = useState(false)
  const [baseUnit, setBaseUnit] = useState(DEFAULT_BASE_UNIT)
  const [handsPerMatch, setHandsPerMatch] = useState(DEFAULT_HANDS_PER_MATCH)
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({ ...soundManager.settings })
  const [theme, setTheme] = useState(loadTheme)
  const startNewMatch = useGameStore((s) => s.startNewMatch)

  return (
    <>
      <button className={styles.trigger} onClick={() => setOpen(true)} aria-label="设置">
        ⚙
      </button>
      {open && (
        <div className={styles.overlay}>
          <div className={styles.panel}>
            <h2>设置</h2>
            <label className={styles.field}>
              每番点数（屁胡基数）
              <input type="number" min={1} value={baseUnit} onChange={(e) => setBaseUnit(Number(e.target.value))} />
            </label>
            <label className={styles.field}>
              每场局数
              <input type="number" min={1} value={handsPerMatch} onChange={(e) => setHandsPerMatch(Number(e.target.value))} />
            </label>
            <div className={styles.themeLabel}>牌桌风格</div>
            <div className={styles.themeRow}>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.themeOption} ${theme === t.id ? styles.themeActive : ''}`}
                  onClick={() => {
                    applyTheme(t.id)
                    setTheme(t.id)
                  }}
                >
                  <span
                    className={styles.themeSwatch}
                    style={{ background: `linear-gradient(135deg, ${t.backSwatch} 0%, ${t.backSwatch} 45%, ${t.feltSwatch} 55%)` }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
            {AUDIO_OPTIONS.map(({ key, label }) => (
              <label key={key} className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={audioSettings[key]}
                  onChange={(e) => {
                    soundManager.setSetting(key, e.target.checked)
                    setAudioSettings({ ...soundManager.settings })
                  }}
                />
                {label}
              </label>
            ))}
            <div className={styles.actions}>
              <button className={styles.cancel} onClick={() => setOpen(false)}>
                取消
              </button>
              <button
                className={styles.apply}
                onClick={() => {
                  startNewMatch({ baseUnit, handsPerMatch })
                  setOpen(false)
                }}
              >
                应用并开始新一场
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

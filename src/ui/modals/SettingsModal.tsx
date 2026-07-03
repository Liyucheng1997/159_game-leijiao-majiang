import { useState } from 'react'
import { DEFAULT_BASE_UNIT, DEFAULT_HANDS_PER_MATCH } from '../../engine/constants'
import { useGameStore } from '../../store/gameStore'
import styles from './SettingsModal.module.css'

export function SettingsModal() {
  const [open, setOpen] = useState(false)
  const [baseUnit, setBaseUnit] = useState(DEFAULT_BASE_UNIT)
  const [handsPerMatch, setHandsPerMatch] = useState(DEFAULT_HANDS_PER_MATCH)
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

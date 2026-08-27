import { labelFromTileId } from '../board/tileLabels'
import type { GameEvent } from '../engine/types'

/**
 * 全程序化音频:不加载任何音频文件。
 * - 打牌/摸牌/补花/胡牌等音效用 Web Audio 合成(噪声脆响、拨弦、琶音)
 * - 吃/碰/杠/胡 用浏览器中文 TTS 报牌
 * - 背景音乐是五声音阶(宫调)古筝风格的程序化循环
 * 浏览器自动播放策略要求首次用户手势后才能出声,init() 会挂一次性监听。
 */

export interface AudioSettings {
  sfx: boolean
  music: boolean
  voice: boolean
}

const STORAGE_KEY = 'leijiao-audio-settings'

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { sfx: true, music: true, voice: true, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { sfx: true, music: true, voice: true }
}

class SoundManager {
  settings: AudioSettings = loadSettings()

  private ctx: AudioContext | null = null
  private sfxGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private musicTimer: number | null = null
  private nextNoteTime = 0
  private musicStep = 0
  private initialized = false
  /** ?fast 模式下抑制语音,避免 TTS 队列爆炸 */
  throttleVoice = false

  /** 挂一次性手势监听;真正的 AudioContext 在首次交互时创建。 */
  init() {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true
    const unlock = () => {
      this.ensureContext()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    // 页面切到后台就整体静音(挂起音频上下文并取消语音),回到前台恢复,
    // 避免后台标签页幽灵般地继续放背景音乐。
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend()
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          this.speechBacklog = 0
        }
      } else if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume()
      }
    })
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      const master = this.ctx.createGain()
      master.gain.value = 0.9
      master.connect(this.ctx.destination)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = 0.55
      this.sfxGain.connect(master)

      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = this.settings.music ? 0.13 : 0
      // 轻混响感:并联一路反馈延迟
      const delay = this.ctx.createDelay(1)
      delay.delayTime.value = 0.31
      const feedback = this.ctx.createGain()
      feedback.gain.value = 0.32
      const wet = this.ctx.createGain()
      wet.gain.value = 0.4
      this.musicGain.connect(master)
      this.musicGain.connect(delay)
      delay.connect(feedback)
      feedback.connect(delay)
      delay.connect(wet)
      wet.connect(master)
    }
    // 页面在后台时保持挂起状态(见 init 里的 visibilitychange),不要被音效事件唤醒
    if (this.ctx.state === 'suspended' && !document.hidden) void this.ctx.resume()
    if (this.settings.music && this.musicTimer === null) this.startMusic()
    return this.ctx
  }

  setSetting<K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) {
    this.settings[key] = value
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
    } catch {
      /* ignore */
    }
    if (key === 'music') {
      if (this.musicGain) this.musicGain.gain.value = value ? 0.13 : 0
      if (value) this.ensureContext()
      else this.stopMusic()
    }
  }

  /* ---------------- 音效合成 ---------------- */

  private noiseBuffer(duration: number): AudioBuffer | null {
    const ctx = this.ctx
    if (!ctx) return null
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  /** 麻将牌拍在桌面上的脆响:短噪声过带通 + 低频冲击。 */
  playDiscard() {
    if (!this.settings.sfx) return
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain) return
    const t = ctx.currentTime

    const noise = ctx.createBufferSource()
    const buf = this.noiseBuffer(0.07)
    if (!buf) return
    noise.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1700 + Math.random() * 700
    bp.Q.value = 1.1
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.9, t)
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    noise.connect(bp).connect(ng).connect(this.sfxGain)
    noise.start(t)

    const thump = ctx.createOscillator()
    thump.type = 'sine'
    thump.frequency.setValueAtTime(210, t)
    thump.frequency.exponentialRampToValueAtTime(90, t + 0.06)
    const tg = ctx.createGain()
    tg.gain.setValueAtTime(0.5, t)
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
    thump.connect(tg).connect(this.sfxGain)
    thump.start(t)
    thump.stop(t + 0.1)
  }

  /** 摸牌:很轻的一声嗒。 */
  playDraw() {
    if (!this.settings.sfx) return
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain) return
    const t = ctx.currentTime
    const noise = ctx.createBufferSource()
    const buf = this.noiseBuffer(0.03)
    if (!buf) return
    noise.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2600
    bp.Q.value = 2
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.12, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
    noise.connect(bp).connect(g).connect(this.sfxGain)
    noise.start(t)
  }

  private pluck(freq: number, when: number, gain: number, dest: AudioNode) {
    const ctx = this.ctx
    if (!ctx) return
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2.005
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(3200, when)
    lp.frequency.exponentialRampToValueAtTime(700, when + 0.9)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, when)
    g.gain.linearRampToValueAtTime(gain, when + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0005, when + 1.3)
    const g2 = ctx.createGain()
    g2.gain.value = 0.25
    osc.connect(lp)
    osc2.connect(g2).connect(lp)
    lp.connect(g).connect(dest)
    osc.start(when)
    osc2.start(when)
    osc.stop(when + 1.4)
    osc2.stop(when + 1.4)
  }

  /** 补花:两声清脆高音。 */
  playFlower() {
    if (!this.settings.sfx) return
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain) return
    const t = ctx.currentTime
    this.pluck(1318.5, t, 0.22, this.sfxGain)
    this.pluck(1760, t + 0.09, 0.18, this.sfxGain)
  }

  /** 胡牌:五声音阶琶音上行。 */
  playWin() {
    if (!this.settings.sfx) return
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain) return
    const t = ctx.currentTime
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]
    notes.forEach((f, i) => this.pluck(f, t + i * 0.09, 0.3, this.sfxGain as AudioNode))
  }

  /** 流局:两声低沉的木鱼感。 */
  playExhausted() {
    if (!this.settings.sfx) return
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain) return
    const t = ctx.currentTime
    this.pluck(220, t, 0.3, this.sfxGain)
    this.pluck(174.6, t + 0.28, 0.3, this.sfxGain)
  }

  /* ---------------- 语音报牌 ---------------- */

  /** 自己维护的语音积压数(SpeechSynthesis API 只给布尔 pending)。 */
  private speechBacklog = 0

  /**
   * interrupt=true(吃/碰/杠/胡):立即打断当前语音抢先播报。
   * interrupt=false(报出的牌名):温和排队;积压超过 2 条就丢弃,
   * 避免快速连打时语音越落越远。
   */
  private speak(text: string, seatIdx: number, interrupt = false) {
    if (!this.settings.voice || this.throttleVoice) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    // 页面在后台时不出声(TTS 不经过 AudioContext,需单独拦)
    if (document.hidden) return
    const synth = window.speechSynthesis
    if (interrupt) {
      synth.cancel()
      this.speechBacklog = 0
    } else if (this.speechBacklog >= 2) {
      return
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'zh-CN'
    const voice = synth.getVoices().find((v) => v.lang.startsWith('zh'))
    if (voice) utter.voice = voice
    utter.rate = 1.15
    // 四个座位给不同音高,听得出是谁在叫
    utter.pitch = [1.0, 1.25, 0.85, 1.1][seatIdx] ?? 1
    utter.volume = 1
    const done = () => {
      this.speechBacklog = Math.max(0, this.speechBacklog - 1)
    }
    utter.onend = done
    utter.onerror = done
    this.speechBacklog++
    synth.speak(utter)
  }

  /* ---------------- 背景音乐 ---------------- */

  private startMusic() {
    const ctx = this.ctx
    if (!ctx || this.musicTimer !== null) return
    this.nextNoteTime = ctx.currentTime + 0.1
    this.musicStep = 0
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 180)
  }

  private stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer)
      this.musicTimer = null
    }
  }

  /** 宫调五声音阶,C 宫:C D E G A。慢速、稀疏、随机化的古筝风分解句。 */
  private scheduleMusic() {
    const ctx = this.ctx
    if (!ctx || !this.musicGain) return
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99]
    const stepDur = 0.42 // ~72bpm 的八分音符
    while (this.nextNoteTime < ctx.currentTime + 0.5) {
      const step = this.musicStep % 32
      // 每小节第一拍给低音宫或徵
      if (step % 8 === 0) {
        this.pluck(step % 16 === 0 ? 130.81 : 98.0, this.nextNoteTime, 0.35, this.musicGain)
      }
      // 旋律:约 2/3 的步进出声,音高随机游走
      if (Math.random() < 0.62) {
        const idx = Math.min(scale.length - 1, Math.max(0, Math.floor(Math.random() * scale.length)))
        this.pluck(scale[idx], this.nextNoteTime + (Math.random() < 0.2 ? stepDur / 2 : 0), 0.28, this.musicGain)
      }
      this.nextNoteTime += stepDur
      this.musicStep++
    }
  }

  /* ---------------- 事件入口 ---------------- */

  handleEvents(events: GameEvent[]) {
    for (const event of events) {
      switch (event.type) {
        case 'draw':
          this.playDraw()
          break
        case 'discard': {
          this.playDiscard()
          // 打出去每张牌都报牌名,如「三万」「红中」
          const label = labelFromTileId(event.tileId)
          if (label) this.speak(label, event.playerIdx)
          break
        }
        case 'flowerRevealed':
          this.playFlower()
          break
        case 'meld': {
          const label = event.meld.type === 'chi' ? '吃' : event.meld.type === 'peng' ? '碰' : '杠'
          this.speak(label, event.playerIdx, true)
          this.playDiscard()
          break
        }
        case 'handOver':
          if (event.result.winnerIdx !== null) {
            this.speak(event.result.isSelfDraw ? '自摸' : '胡', event.result.winnerIdx, true)
            this.playWin()
          } else {
            this.playExhausted()
          }
          break
      }
    }
  }
}

export const soundManager = new SoundManager()

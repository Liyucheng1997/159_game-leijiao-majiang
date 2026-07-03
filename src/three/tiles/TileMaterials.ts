import * as THREE from 'three'
import type { FlowerKindId, TileKindId } from '../../engine/types'

const CANVAS_SIZE = 128
const FONT_FAMILY = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif'

const WIND_LABELS = ['东', '南', '西', '北']
const DRAGON_LABELS = ['中', '发', '白']
const DRAGON_COLORS = ['#a12626', '#1b6e3c', '#2b2b2b']
const FLOWER_LABELS = ['春', '夏', '秋', '冬', '梅', '兰', '竹', '菊']

interface TileLabel {
  main: string
  sub: string | null
  color: string
}

function labelForKind(kindId: TileKindId): TileLabel {
  if (kindId < 27) {
    const rank = (kindId % 9) + 1
    const suit = kindId < 9 ? '万' : kindId < 18 ? '条' : '筒'
    const color = kindId < 9 ? '#a12626' : kindId < 18 ? '#1b6e3c' : '#1c4fa0'
    return { main: String(rank), sub: suit, color }
  }
  if (kindId < 31) return { main: WIND_LABELS[kindId - 27], sub: null, color: '#2b2b2b' }
  const dragonIdx = kindId - 31
  return { main: DRAGON_LABELS[dragonIdx], sub: null, color: DRAGON_COLORS[dragonIdx] }
}

function labelForFlower(flowerKindId: FlowerKindId): TileLabel {
  return { main: FLOWER_LABELS[flowerKindId], sub: null, color: '#b5722a' }
}

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  return { canvas, ctx }
}

function paintFaceBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f5f0e1'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, CANVAS_SIZE - 4, CANVAS_SIZE - 4)
}

function generateFaceTexture(label: TileLabel): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas()
  paintFaceBackground(ctx)
  ctx.fillStyle = label.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (label.sub) {
    ctx.font = `bold ${CANVAS_SIZE * 0.36}px ${FONT_FAMILY}`
    ctx.fillText(label.main, CANVAS_SIZE / 2, CANVAS_SIZE * 0.36)
    ctx.font = `bold ${CANVAS_SIZE * 0.3}px ${FONT_FAMILY}`
    ctx.fillText(label.sub, CANVAS_SIZE / 2, CANVAS_SIZE * 0.72)
  } else {
    ctx.font = `bold ${CANVAS_SIZE * 0.48}px ${FONT_FAMILY}`
    ctx.fillText(label.main, CANVAS_SIZE / 2, CANVAS_SIZE / 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function generateBackTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas()
  ctx.fillStyle = '#8a2f2f'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 3
  const inset = 18
  ctx.strokeRect(inset, inset, CANVAS_SIZE - inset * 2, CANVAS_SIZE - inset * 2)
  ctx.beginPath()
  ctx.moveTo(CANVAS_SIZE / 2, inset)
  ctx.lineTo(CANVAS_SIZE - inset, CANVAS_SIZE / 2)
  ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE - inset)
  ctx.lineTo(inset, CANVAS_SIZE / 2)
  ctx.closePath()
  ctx.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const glyphTextureCache = new Map<string, THREE.CanvasTexture>()
let backTextureCache: THREE.CanvasTexture | null = null
let bodyMaterialCache: THREE.MeshStandardMaterial | null = null
let bottomMaterialCache: THREE.MeshStandardMaterial | null = null

export function getGlyphTexture(kindId: TileKindId | null, flowerKindId: FlowerKindId | null, isFlower: boolean): THREE.CanvasTexture {
  const key = isFlower ? `f${flowerKindId}` : `k${kindId}`
  const cached = glyphTextureCache.get(key)
  if (cached) return cached
  const label = isFlower ? labelForFlower(flowerKindId as FlowerKindId) : labelForKind(kindId as TileKindId)
  const texture = generateFaceTexture(label)
  glyphTextureCache.set(key, texture)
  return texture
}

export function getBackTexture(): THREE.CanvasTexture {
  if (!backTextureCache) backTextureCache = generateBackTexture()
  return backTextureCache
}

export function getBodyMaterial(): THREE.MeshStandardMaterial {
  if (!bodyMaterialCache) bodyMaterialCache = new THREE.MeshStandardMaterial({ color: '#ece4d0', roughness: 0.7 })
  return bodyMaterialCache
}

export function getBottomMaterial(): THREE.MeshStandardMaterial {
  if (!bottomMaterialCache) bottomMaterialCache = new THREE.MeshStandardMaterial({ color: '#3a3a3a', roughness: 0.8 })
  return bottomMaterialCache
}

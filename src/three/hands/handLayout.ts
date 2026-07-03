import * as THREE from 'three'
import { TILE_HEIGHT, TILE_WIDTH } from '../tiles/Tile3D'

export interface HandTileLayout {
  position: [number, number, number]
  rotation: [number, number, number]
}

const HAND_RADIUS = 3.0
const HAND_Y = TILE_HEIGHT / 2

/**
 * Lays out `count` standing tiles in a row facing outward from table center,
 * on the given seat's side. seatIndex 0=south(human), 1=east, 2=north, 3=west
 * — matching Wall3D's side numbering so hands sit just inside their own wall.
 */
export function buildHandLayout(count: number, seatIndex: number, spacingScale = 1.08): HandTileLayout[] {
  const angle = seatIndex * (Math.PI / 2)
  const step = TILE_WIDTH * spacingScale
  const rowLength = count * step
  const start = -rowLength / 2 + step / 2
  const up = new THREE.Vector3(0, 1, 0)
  const layout: HandTileLayout[] = []
  for (let i = 0; i < count; i++) {
    const localX = start + i * step
    const v = new THREE.Vector3(localX, HAND_Y, HAND_RADIUS).applyAxisAngle(up, angle)
    layout.push({ position: [v.x, v.y, v.z], rotation: [Math.PI / 2, angle, 0] })
  }
  return layout
}

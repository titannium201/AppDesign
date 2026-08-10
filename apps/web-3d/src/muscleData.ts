export type LayerKey =
  | 'composite'
  | 'oxygenation'
  | 'perfusion'
  | 'thermal'
  | 'mechanical'

export interface LayerValue {
  value: number
  score: number
  label: string
}

export interface MuscleInfo {
  meshId: string
  baseName: string
  region: string
  displayName: string
}

// 绿 -> 黄 -> 橙 -> 红 -> 深红
const HEATMAP_STOPS = [
  { t: 0.0, color: '#22c55e' }, // green-500
  { t: 0.25, color: '#eab308' }, // yellow-500
  { t: 0.5, color: '#f97316' }, // orange-500
  { t: 0.75, color: '#ef4444' }, // red-500
  { t: 1.0, color: '#7f1d1d' }, // red-900
]

export function getLayerLabel(layer: LayerKey): string {
  const labels: Record<LayerKey, string> = {
    composite: '综合恢复',
    oxygenation: '氧合',
    perfusion: '灌注',
    thermal: '热状态',
    mechanical: '力学',
  }
  return labels[layer]
}

export function getColorForValue(_layer: LayerKey, value: number): string {
  const clamped = Math.max(0, Math.min(1, value))
  let lower = HEATMAP_STOPS[0]
  let upper = HEATMAP_STOPS[HEATMAP_STOPS.length - 1]

  for (let i = 0; i < HEATMAP_STOPS.length - 1; i++) {
    if (clamped >= HEATMAP_STOPS[i].t && clamped <= HEATMAP_STOPS[i + 1].t) {
      lower = HEATMAP_STOPS[i]
      upper = HEATMAP_STOPS[i + 1]
      break
    }
  }

  const range = upper.t - lower.t
  if (range === 0) return upper.color

  const ratio = (clamped - lower.t) / range
  return interpolateColor(lower.color, upper.color, ratio)
}

function interpolateColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  const r = Math.round(ca.r + (cb.r - ca.r) * t)
  const g = Math.round(ca.g + (cb.g - ca.g) * t)
  const b2 = Math.round(ca.b + (cb.b - ca.b) * t)
  return `rgb(${r}, ${g}, ${b2})`
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const LAYER_RANGES: Record<LayerKey, [number, number]> = {
  composite: [40, 95],
  oxygenation: [55, 100],
  perfusion: [35, 90],
  thermal: [20, 80],
  mechanical: [25, 85],
}

export function generateMockLayerData(
  meshIds: string[],
  layer: LayerKey
): Record<string, LayerValue> {
  const [min, max] = LAYER_RANGES[layer]
  const data: Record<string, LayerValue> = {}

  meshIds.forEach((id) => {
    const seed = hashString(id) + hashString(layer)
    const score = Math.floor(min + seededRandom(seed) * (max - min + 1))
    data[id] = {
      value: score / 100,
      score,
      label: `${score}`,
    }
  })

  return data
}

export async function loadLegMuscles(): Promise<MuscleInfo[]> {
  const response = await fetch('/data/leg-muscles.json')
  if (!response.ok) {
    throw new Error(`Failed to load leg muscles: ${response.status}`)
  }
  return response.json()
}

import * as osc from 'osc'
import { X32State } from './state'

export const MEDIA_PLAYER_SOURCE_CLIP_OFFSET = 1000

export function assertUnreachable(_never: never): void {
  // throw new Error('Unreachable')
}

export function literal<T>(val: T): T {
  return val
}

export type Required<T> = T extends object ? { [P in keyof T]-?: NonNullable<T[P]> } : T

export function ensureLoaded(oscSocket: osc.UDPPort, state: X32State, path: string): void {
  // console.log(`Ensure: ${path}`)
  if (!state.get(path)) {
    try {
      oscSocket.send({
        address: path,
        args: []
      })
    } catch (e) {
      console.error(`OSC error: ${e}`)
    }
  }
}

export function padNumber(i: number): string {
  return ('0' + i).substr(-2)
}

export function floatToDB(f: number): number {
  if (f >= 0.5) {
    return f * 40 - 30 // max dB value: +10.
  } else if (f >= 0.25) {
    return f * 80 - 50
  } else if (f >= 0.0625) {
    return f * 160 - 70
  } else if (f >= 0.0) {
    return f * 480 - 90 // min dB value: -90 or -oo
  } else {
    return Number.NEGATIVE_INFINITY
  }
}

export function dbToFloat(d: number): number {
  let f: number
  if (d < -60) {
    f = (d + 90) / 480
  } else if (d < -30) {
    f = (d + 70) / 160
  } else if (d < -10) {
    f = (d + 50) / 80
  } else if (d <= 10) {
    f = (d + 30) / 40
  } else {
    f = 1
  }
  // Optionally round “f” to a X32 known value
  return f // Math.round((f * 1023.5) / 1023.0)
}

export function formatDb(d: number): string {
  // Round to 1dp
  d = Math.round(d * 10) / 10

  if (d <= -90) {
    return '-inf'
  } else if (d > 0) {
    return `+${d}dB`
  } else {
    return `${d}dB`
  }
}
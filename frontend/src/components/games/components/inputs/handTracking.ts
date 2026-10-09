import type { GestureRecognizer } from '@mediapipe/tasks-vision'
import type { Direction } from '../displays/DirectionDisplay'
import { getNative } from '../../../../native'

export type HandSession = { video: HTMLVideoElement; recognizer: GestureRecognizer }

type OpenSession = HandSession & { stop: () => void }

/** How long the camera stays on after the last input unmounted, so consecutive rounds reuse it. */
const KEEP_ALIVE_MS = 2000

let session: Promise<OpenSession> | null = null
let users = 0
let releaseTimer: ReturnType<typeof setTimeout> | undefined

async function createRecognizer(): Promise<GestureRecognizer> {
  const { FilesetResolver, GestureRecognizer } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
  const make = (delegate: 'GPU' | 'CPU') =>
    GestureRecognizer.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: '/mediapipe/gesture_recognizer.task', delegate },
      runningMode: 'VIDEO',
      numHands: 2,
    })
  try {
    return await make('GPU')
  } catch {
    return make('CPU')
  }
}

async function start(): Promise<OpenSession> {
  const camera = await getNative().camera.openStream()
  try {
    if (!camera.stream) throw new Error('no camera stream')
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.srcObject = camera.stream
    const [recognizer] = await Promise.all([createRecognizer(), video.play()])
    return {
      video,
      recognizer,
      stop: () => {
        recognizer.close()
        camera.stop()
        video.srcObject = null
      },
    }
  } catch (e) {
    camera.stop()
    throw e
  }
}

/**
 * Opens the camera and the hand recognizer, shared by every input mounted at the same time or right after
 * one another. Call `release` when done; the camera stops shortly after the last release.
 */
export function acquireHandSession(): { ready: Promise<HandSession>; release: () => void } {
  clearTimeout(releaseTimer)
  users++
  const current = (session ??= start().catch((e) => {
    session = null
    throw e
  }))
  let released = false
  return {
    ready: current,
    release: () => {
      if (released) return
      released = true
      if (--users > 0) return
      releaseTimer = setTimeout(() => {
        const closing = session
        session = null
        closing?.then((s) => s.stop(), () => {})
      }, KEEP_ALIVE_MS)
    },
  }
}

/** Pairs of the 21 hand landmarks joined by a bone: thumb, index, middle, ring, pinky, then the palm. Spelled out so the library stays lazy-loaded. */
export const HAND_BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

export type Hand = {
  /** an open palm facing the camera */
  palm: boolean
  /** wrist position on the mirrored preview, 0 (left edge) to 1 (right edge) */
  x: number
}

/** The side of the preview holding open palms, or null when there are none or palms on both sides. */
export function palmSide(hands: Hand[]): Direction | null {
  const sides = new Set(hands.filter((h) => h.palm).map((h) => (h.x < 0.5 ? 'left' : 'right') as Direction))
  return sides.size === 1 ? [...sides][0] : null
}

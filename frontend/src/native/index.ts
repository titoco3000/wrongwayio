/**
 * The one place that picks real vs. web/mock implementations. App code imports `native` from here
 * and only sees the interfaces. Real Capacitor plugins are added in later phases: until then the
 * native shell uses the same fallbacks as the browser.
 */
import { isNative } from './platform'
import { WebCamera, type Camera } from './camera'
import { WebNotifications, type Notifications } from './notifications'
import { VoskSpeech, type Speech } from './speech'

export type Native = { notifications: Notifications; camera: Camera; speech: Speech }

/** Fallbacks used where no plugin exists yet. */
const webImplementations = (): Native => ({
  notifications: new WebNotifications(),
  camera: new WebCamera(),
  speech: new VoskSpeech(),
})

/** Picks implementations for the platform. `native` is true in the Capacitor shell. */
export function createNative(native: boolean = isNative()): Native {
  // later phases: if (native) return { notifications: new CapacitorNotifications(), ... }
  void native
  return webImplementations()
}

let current: Native | null = null

/** The implementations the app uses. */
export const getNative = (): Native => (current ??= createNative())

/** Tests swap in mocks, e.g. `setNative({ ...getNative(), speech: new MockSpeech() })`. */
export const setNative = (n: Native | null) => {
  current = n
}

export type { Notifications, Camera, Speech }
export type { Transcript } from './speech'
export type { CameraStream } from './camera'
export type { PermissionState } from './notifications'

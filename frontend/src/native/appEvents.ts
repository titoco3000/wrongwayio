import { App } from '@capacitor/app'
import { isNative } from './platform'

type Unsubscribe = () => void
const noop: Unsubscribe = () => {}

// Nested stacks each register a handler; only the most recent one (the innermost open stack) runs.
const backHandlers: (() => void)[] = []
let backListener: Promise<{ remove: () => Promise<void> }> | null = null

/**
 * Android hardware back button. `handler` runs instead of the default (closing the app); when
 * several are registered the latest wins. No-op in a browser, which has its own back button.
 */
export function onBackButton(handler: () => void): Unsubscribe {
  if (!isNative()) return noop
  backHandlers.push(handler)
  backListener ??= App.addListener('backButton', () => backHandlers.at(-1)?.())
  return () => {
    const i = backHandlers.lastIndexOf(handler)
    if (i >= 0) backHandlers.splice(i, 1)
  }
}

/** Sends the app to the background, like pressing Home. */
export const minimizeApp = () => (isNative() ? App.minimizeApp() : Promise.resolve())

/**
 * Links that open the app: the one that launched it, and any that arrive while it runs.
 * No-op in a browser, where the link is simply the page URL.
 */
export function onOpenedWithUrl(handler: (url: string) => void): Unsubscribe {
  if (!isNative()) return noop
  let cancelled = false
  App.getLaunchUrl().then((launch) => {
    if (launch?.url && !cancelled) handler(launch.url)
  })
  const handle = App.addListener('appUrlOpen', (e) => handler(e.url))
  return () => {
    cancelled = true
    void handle.then((h) => h.remove())
  }
}

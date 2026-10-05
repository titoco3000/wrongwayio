import { Capacitor } from '@capacitor/core'

/** True inside the Capacitor shell (Android/iOS), false in a plain browser. The only place that asks. */
export const isNative = () => Capacitor.isNativePlatform()

/** Public address of the site. In the shell `location.origin` is the webview's own host, so gift links need this. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://wrongway.io'

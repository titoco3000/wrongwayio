import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // TODO: confirm final reverse-domain id and display name before any store release (see dev-docs/phase/7.md)
  appId: 'io.wrongway.app',
  appName: 'WrongWayio',
  webDir: 'dist',
  server: { androidScheme: 'https' },
}

export default config

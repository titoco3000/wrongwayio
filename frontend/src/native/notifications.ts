export type PermissionState = 'granted' | 'denied' | 'prompt'

export interface Notifications {
  requestPermission(): Promise<PermissionState>
  /** Shows a reminder at `at`. Scheduling the same `id` again replaces it. */
  schedule(reminder: { id: number; title: string; body: string; at: Date }): Promise<void>
  cancel(id: number): Promise<void>
}

/** In-memory fake. Tests read `scheduled` and set `permission`. */
export class MockNotifications implements Notifications {
  permission: PermissionState = 'prompt'
  /** what the user answers when asked */
  answer: Exclude<PermissionState, 'prompt'> = 'granted'
  scheduled = new Map<number, { id: number; title: string; body: string; at: Date }>()

  async requestPermission() {
    if (this.permission === 'prompt') this.permission = this.answer
    return this.permission
  }

  async schedule(reminder: { id: number; title: string; body: string; at: Date }) {
    if (this.permission !== 'granted') throw new Error('notification permission not granted')
    this.scheduled.set(reminder.id, reminder)
  }

  async cancel(id: number) {
    this.scheduled.delete(id)
  }
}

/** Browser version: asks for permission, no scheduling (needs a server push, later phase). */
export class WebNotifications implements Notifications {
  async requestPermission(): Promise<PermissionState> {
    if (typeof Notification === 'undefined') return 'denied'
    const result = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    return result === 'default' ? 'prompt' : result
  }

  async schedule() {
    // the web has no reliable local scheduling; the native implementation replaces this
  }

  async cancel() {}
}

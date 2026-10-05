import { afterEach, describe, expect, it, vi } from 'vitest'
import { createNative, getNative, setNative } from '../src/native'
import { MockNotifications } from '../src/native/notifications'
import { MockCamera } from '../src/native/camera'
import { MockSpeech, WebSpeech, type Transcript } from '../src/native/speech'
import { WebCamera } from '../src/native/camera'
import { WebNotifications } from '../src/native/notifications'

afterEach(() => setNative(null))

describe('MockSpeech', () => {
  it('emits partial then final transcripts while listening', async () => {
    const speech = new MockSpeech()
    const got: Transcript[] = []
    await speech.start((t) => got.push(t))
    speech.say('left')
    speech.finish('left arrow')
    expect(got).toEqual([
      { text: 'left', final: false },
      { text: 'left arrow', final: true },
    ])
  })

  it('emits nothing after stop', async () => {
    const speech = new MockSpeech()
    const got: Transcript[] = []
    await speech.start((t) => got.push(t))
    await speech.stop()
    speech.say('ignored')
    expect(got).toEqual([])
    expect(speech.listening).toBe(false)
  })
})

describe('MockNotifications', () => {
  it('refuses to schedule before permission is granted', async () => {
    const n = new MockNotifications()
    await expect(n.schedule({ id: 1, title: 't', body: 'b', at: new Date() })).rejects.toThrow()
  })

  it('schedules, replaces and cancels by id', async () => {
    const n = new MockNotifications()
    expect(await n.requestPermission()).toBe('granted')
    await n.schedule({ id: 1, title: 'a', body: 'b', at: new Date(0) })
    await n.schedule({ id: 1, title: 'c', body: 'b', at: new Date(0) })
    expect(n.scheduled.size).toBe(1)
    expect(n.scheduled.get(1)?.title).toBe('c')
    await n.cancel(1)
    expect(n.scheduled.size).toBe(0)
  })

  it('reports a denied answer', async () => {
    const n = new MockNotifications()
    n.answer = 'denied'
    expect(await n.requestPermission()).toBe('denied')
  })
})

describe('MockCamera', () => {
  it('returns the scripted photo and counts streams', async () => {
    const cam = new MockCamera()
    expect(await cam.takePhoto()).toBe(cam.photo)
    const s = await cam.openStream()
    s.stop()
    expect([cam.streamsOpened, cam.streamsStopped]).toEqual([1, 1])
  })
})

describe('selection', () => {
  it('returns web implementations on both platforms until native plugins exist', () => {
    for (const native of [false, true]) {
      const n = createNative(native)
      expect(n.notifications).toBeInstanceOf(WebNotifications)
      expect(n.camera).toBeInstanceOf(WebCamera)
      expect(n.speech).toBeInstanceOf(WebSpeech)
    }
  })

  it('caches the choice and lets tests override it', () => {
    expect(getNative()).toBe(getNative())
    const mock = new MockSpeech()
    setNative({ ...getNative(), speech: mock })
    expect(getNative().speech).toBe(mock)
  })

  it('asks Capacitor only through isNative', async () => {
    vi.resetModules()
    vi.doMock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }))
    const { isNative } = await import('../src/native/platform')
    expect(isNative()).toBe(true)
    vi.doUnmock('@capacitor/core')
  })
})

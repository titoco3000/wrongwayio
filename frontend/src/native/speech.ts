import type { Model } from 'vosk-browser'

export type Transcript = { text: string; final: boolean }

export type SpeechOptions = {
  /** language code of the recognizer, e.g. `en` or `pt` */
  language: string
  /** the only words that can be recognized */
  grammar: string[]
  /** called about ten times a second with the microphone's loudness, 0 (silence) to 1 (loud), to show that it works */
  onLevel?: (level: number) => void
}

/** Loudness of a block of samples on a 0-1 scale of decibels, from -60 dB (silence) to -10 dB (loud). */
export function audioLevel(samples: Float32Array): number {
  let sum = 0
  for (const x of samples) sum += x * x
  const db = 20 * Math.log10(Math.sqrt(sum / samples.length) || 1e-6)
  return Math.min(1, Math.max(0, (db + 60) / 50))
}

export interface Speech {
  /**
   * Starts listening. `onTranscript` gets partial results, then a final one. Resolves once listening began;
   * rejects when there is no microphone access or no recognizer for the language.
   */
  start(onTranscript: (t: Transcript) => void, options?: SpeechOptions): Promise<void>
  stop(): Promise<void>
}

/** Scriptable speech source. Tests call `say` and `finish`. */
export class MockSpeech implements Speech {
  listening = false
  private listener: ((t: Transcript) => void) | null = null

  async start(onTranscript: (t: Transcript) => void, _options?: SpeechOptions) {
    this.listening = true
    this.listener = onTranscript
  }

  async stop() {
    this.listening = false
    this.listener = null
  }

  /** Emits a partial transcript. Ignored while not listening, like a real source. */
  say(text: string) {
    if (this.listening) this.listener?.({ text, final: false })
  }

  /** Emits the final transcript. */
  finish(text: string) {
    if (this.listening) this.listener?.({ text, final: true })
  }
}

const models = new Map<string, Promise<Model>>()

/** Loads (once per language) the offline model from `public/models/vosk`, put there by `make models`. */
function loadModel(language: string): Promise<Model> {
  let model = models.get(language)
  if (!model) {
    // absolute: the model's worker is made from a blob, where relative URLs don't resolve
    const url = new URL(`${import.meta.env.BASE_URL}models/vosk/${language}.tar.gz`, window.location.href).href
    model = import('vosk-browser')
      .then(({ createModel }) => createModel(url))
      .catch((e) => {
        models.delete(language)
        throw e
      })
    models.set(language, model)
  }
  return model
}

/** How long the microphone and recognizer stay on after `stop`, so consecutive rounds reuse them. */
const KEEP_ALIVE_MS = 2000
/** Longest wait for the recognizer to answer a flush before listening anyway. */
const FLUSH_TIMEOUT_MS = 500

type Live = {
  /** language and grammar this recognizer was made for */
  key: string
  /** points results to a listener, after discarding whatever was said before */
  attach(sink: (t: Transcript) => void, onLevel?: (level: number) => void): void
  detach(): void
  dispose(): void
}

async function open(key: string, options: SpeechOptions): Promise<Live> {
  const cleanups: (() => void)[] = []
  const dispose = () => {
    while (cleanups.length) cleanups.pop()!()
  }
  try {
    // no browser noise suppression or echo cancellation: they tend to clip short words like "left"
    const media = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: true },
    })
    cleanups.push(() => media.getTracks().forEach((t) => t.stop()))
    const model = await loadModel(options.language)

    const context = new AudioContext()
    cleanups.push(() => void context.close())
    await context.resume()
    const recognizer = new model.KaldiRecognizer(context.sampleRate, JSON.stringify([...options.grammar, '[unk]']))
    cleanups.push(() => recognizer.remove())

    let sink: ((t: Transcript) => void) | null = null
    let onLevel: ((level: number) => void) | undefined
    /** from asking the recognizer to finish its utterance until it answers: anything heard until then is old */
    let flushing = false
    /** audio went in since the last flush */
    let dirty = false
    recognizer.on('partialresult', (m) => {
      if (m.event === 'partialresult' && m.result.partial && sink && !flushing) sink({ text: m.result.partial, final: false })
    })
    recognizer.on('result', (m) => {
      if (m.event !== 'result') return
      if (flushing) flushing = false
      else if (m.result.text && sink) sink({ text: m.result.text, final: true })
    })

    const source = context.createMediaStreamSource(media)
    // deprecated but works in every WebView; the node must reach the destination to run, and outputs silence
    const node = context.createScriptProcessor(4096, 1, 1)
    node.onaudioprocess = (e) => {
      const samples = e.inputBuffer.getChannelData(0).slice()
      onLevel?.(audioLevel(samples))
      dirty = true
      recognizer.acceptWaveformFloat(samples, context.sampleRate)
    }
    source.connect(node)
    node.connect(context.destination)
    cleanups.push(() => {
      node.onaudioprocess = null
      source.disconnect()
      node.disconnect()
    })

    return {
      key,
      attach(newSink, newOnLevel) {
        // the previous round's words may still be in the recognizer: finish that utterance and drop it
        sink = null
        if (dirty) {
          dirty = false
          flushing = true
          recognizer.retrieveFinalResult()
          setTimeout(() => (flushing = false), FLUSH_TIMEOUT_MS)
        }
        sink = newSink
        onLevel = newOnLevel
      },
      detach() {
        sink = null
        onLevel = undefined
      },
      dispose,
    }
  } catch (e) {
    dispose()
    throw e
  }
}

/**
 * Offline recognizer on Vosk (WASM), for the browser and the native shell's WebView alike: audio never leaves the
 * device. Only the words of `options.grammar` are recognized; anything else comes out as noise and is dropped.
 * The microphone and recognizer stay on for a moment after `stop`, so the next round starts listening at once.
 */
export class VoskSpeech implements Speech {
  private current: { key: string; ready: Promise<Live> } | null = null
  private idleTimer: ReturnType<typeof setTimeout> | undefined
  /** bumped by every start and stop, so a start that is still loading notices it was cancelled */
  private generation = 0

  async start(onTranscript: (t: Transcript) => void, options?: SpeechOptions) {
    if (!options) throw new Error('speech needs a language and a grammar')
    clearTimeout(this.idleTimer)
    const generation = ++this.generation
    const key = JSON.stringify([options.language, options.grammar])
    if (this.current && this.current.key !== key) this.teardown()
    if (!this.current) {
      const current = { key, ready: open(key, options) }
      this.current = current
      // a failed start leaves nothing behind, so the next one asks for the permission again
      current.ready.catch(() => {
        if (this.current === current) this.current = null
      })
    }
    const live = await this.current.ready
    if (generation !== this.generation) return
    live.attach(onTranscript, options.onLevel)
  }

  async stop() {
    this.generation++
    const current = this.current
    current?.ready.then((live) => live.detach(), () => {})
    clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      if (this.current === current) this.teardown()
    }, KEEP_ALIVE_MS)
  }

  private teardown() {
    const current = this.current
    this.current = null
    current?.ready.then((live) => live.dispose(), () => {})
  }
}

export type Transcript = { text: string; final: boolean }

export interface Speech {
  /** Starts listening. `onTranscript` gets partial results, then a final one. Resolves once listening began. */
  start(onTranscript: (t: Transcript) => void): Promise<void>
  stop(): Promise<void>
}

/** Scriptable speech source. Tests call `say` and `finish`. */
export class MockSpeech implements Speech {
  listening = false
  private listener: ((t: Transcript) => void) | null = null

  async start(onTranscript: (t: Transcript) => void) {
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

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  start(): void
  stop(): void
}

/** Browser version on the Web Speech API. Fine in desktop browsers; the native shell must not use it. */
export class WebSpeech implements Speech {
  private recognition: SpeechRecognitionLike | null = null

  async start(onTranscript: (t: Transcript) => void) {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Ctor) throw new Error('speech recognition is not supported here')
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (e) => {
      const last = e.results[e.results.length - 1]
      onTranscript({ text: last[0].transcript, final: last.isFinal })
    }
    recognition.start()
    this.recognition = recognition
  }

  async stop() {
    this.recognition?.stop()
    this.recognition = null
  }
}

export interface Camera {
  /** Takes one photo. Resolves to an image `Blob`, or null if the user cancelled. */
  takePhoto(): Promise<Blob | null>
  /** Opens the camera as a live stream. Call `stop` on the result when done. */
  openStream(): Promise<CameraStream>
}

export interface CameraStream {
  stream: MediaStream | null
  stop(): void
}

/** Fake camera: hands back the given photo and a stream-less handle. */
export class MockCamera implements Camera {
  photo: Blob | null = new Blob(['mock'], { type: 'image/png' })
  streamsOpened = 0
  streamsStopped = 0

  async takePhoto() {
    return this.photo
  }

  async openStream(): Promise<CameraStream> {
    this.streamsOpened++
    return { stream: null, stop: () => void this.streamsStopped++ }
  }
}

/** Browser version on top of `getUserMedia`. */
export class WebCamera implements Camera {
  async takePhoto(): Promise<Blob | null> {
    const { stream, stop } = await this.openStream()
    try {
      const video = document.createElement('video')
      video.srcObject = stream
      video.muted = true
      await video.play()
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    } finally {
      stop()
    }
  }

  async openStream(): Promise<CameraStream> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    return { stream, stop: () => stream.getTracks().forEach((t) => t.stop()) }
  }
}

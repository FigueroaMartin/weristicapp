/**
 * Sequential playback queue for a TTS engine. Ensures multiple `speak()`
 * calls don't overlap — each waits its turn — while still allowing the
 * caller to cancel the current utterance or wipe the whole queue.
 *
 * @param {import('./engines/TTSEngine').TTSEngine} engine
 */
export function createQueue(engine) {
  const items = []
  let playing = false

  async function processNext() {
    if (playing || items.length === 0) return
    playing = true
    const { text, opts, resolve, reject } = items.shift()

    try {
      await engine.speak(text, opts)
      resolve()
    } catch (err) {
      reject(err)
    } finally {
      playing = false
      processNext()
    }
  }

  return {
    /** Adds text to the queue; resolves once that utterance finishes. */
    enqueue(text, opts) {
      return new Promise((resolve, reject) => {
        items.push({ text, opts, resolve, reject })
        processNext()
      })
    },

    /** Stops the utterance currently playing; remaining queue continues. */
    cancelCurrent() {
      engine.stop()
    },

    /** Stops playback and discards everything still queued. */
    cancelAll() {
      items.length = 0
      engine.stop()
    },

    isPlaying() {
      return playing
    },

    pendingCount() {
      return items.length
    },
  }
}

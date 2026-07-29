/**
 * Public TTS API. This is the ONLY module the rest of the app should ever
 * import — never reach into `engines/`, `queue.js`, `voiceSelector.js`, etc.
 * directly. That keeps the entire text-to-speech implementation swappable
 * without touching any calling code. See src/tts/README.md.
 *
 * Usage:
 *   import { tts } from '../tts'
 *   await tts.speak('Hola, soy Lya, tu asistente.')
 *   tts.stop()
 */
import { createPiperEngine } from './engines/piperEngine'
import { createQueue } from './queue'

// --- Active engine -----------------------------------------------------
// Piper (neural, in-browser) replaced the Web Speech engine because OS
// voices sounded too robotic. To swap engines again later, change only
// this one import + constructor call — nothing else in the app changes.
const engine = createPiperEngine()
const queue = engine ? createQueue(engine) : null

export const tts = {
  /** Whether this browser/device supports speech synthesis at all. */
  isSupported: Boolean(engine),

  /**
   * Queues `text` to be spoken. Multiple calls play back-to-back, never
   * overlapping. Resolves when this specific utterance finishes.
   * @param {string} text
   * @param {{rate?: number, pitch?: number, volume?: number}} [opts]
   */
  speak(text, opts) {
    if (!queue || !text) return Promise.resolve()
    return queue.enqueue(text, opts)
  },

  /** Stops the utterance currently playing; anything queued after it still plays. */
  stopCurrent() {
    queue?.cancelCurrent()
  },

  /** Stops playback immediately and clears anything still queued. */
  stop() {
    queue?.cancelAll()
  },

  /** True while an utterance is actively being spoken. */
  isPlaying() {
    return queue?.isPlaying() ?? false
  },

  /** Lists Spanish voices available on this device. */
  async listVoices() {
    return engine ? engine.listVoices() : []
  },

  /**
   * Changes the active voice. Use `tts.listVoices()` to get valid ids for
   * the current engine (Piper voice ids, e.g. "es_MX-claude-high").
   * @param {string} voiceId
   */
  async setVoice(voiceId) {
    await engine?.setVoice(voiceId)
  },

  /** Playback speed, 0.1–10 (1 = normal). */
  setRate(rate) { engine?.setRate(rate) },

  /** Volume, 0–1. */
  setVolume(volume) { engine?.setVolume(volume) },

  /** Pitch, 0–2 (1 = normal). */
  setPitch(pitch) { engine?.setPitch(pitch) },
}

export default tts

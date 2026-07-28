import { TTS_CONFIG } from '../config'
import { resolveVoice } from '../voiceSelector'

/**
 * Resolves once the browser has finished loading its voice list.
 * Some browsers (notably Chrome) populate `getVoices()` asynchronously
 * via the `voiceschanged` event; others return it synchronously.
 */
function loadVoices(synth) {
  return new Promise((resolve) => {
    const existing = synth.getVoices()
    if (existing.length > 0) { resolve(existing); return }

    synth.onvoiceschanged = () => resolve(synth.getVoices())
    // Fallback for engines that never fire voiceschanged.
    setTimeout(() => resolve(synth.getVoices()), 500)
  })
}

/**
 * TTS engine backed by the browser's native Web Speech API
 * (SpeechSynthesis). Runs fully on-device via the OS/browser's built-in
 * voices — no network request, no model download, works offline.
 *
 * @returns {import('./TTSEngine').TTSEngine | null} null if unsupported.
 */
export function createWebSpeechEngine() {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return null
  }

  const synth = window.speechSynthesis
  let voices = []
  let selectedVoice = null
  let rate = TTS_CONFIG.rate
  let pitch = TTS_CONFIG.pitch
  let volume = TTS_CONFIG.volume

  const ready = loadVoices(synth).then((loaded) => {
    voices = loaded
    selectedVoice = resolveVoice(TTS_CONFIG.defaultVoiceId, voices)
  })

  return {
    async speak(text, opts = {}) {
      await ready
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.voice = selectedVoice
        utterance.lang = selectedVoice?.lang || TTS_CONFIG.lang
        utterance.rate = opts.rate ?? rate
        utterance.pitch = opts.pitch ?? pitch
        utterance.volume = opts.volume ?? volume
        utterance.onend = () => resolve()
        utterance.onerror = (event) => {
          // "interrupted"/"canceled" happen on manual stop() — not real errors.
          if (event.error === 'interrupted' || event.error === 'canceled') resolve()
          else reject(event.error)
        }
        synth.speak(utterance)
      })
    },

    stop() {
      synth.cancel()
    },

    async listVoices() {
      await ready
      return voices
        .filter((v) => v.lang?.toLowerCase().startsWith('es'))
        .map((v) => ({ id: v.voiceURI, name: v.name, lang: v.lang }))
    },

    async setVoice(voiceId) {
      await ready
      selectedVoice = resolveVoice(voiceId, voices)
    },

    setRate(value) { rate = value },
    setVolume(value) { volume = value },
    setPitch(value) { pitch = value },
  }
}

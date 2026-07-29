import { TtsSession, voices as fetchPiperVoices } from '@mintplex-labs/piper-tts-web'
import { TTS_CONFIG } from '../config'

const STORAGE_KEY = 'weristicapp_tts_voice'

// @mintplex-labs/piper-tts-web hardcodes its ONNX runtime CDN URL to an
// old onnxruntime-web version (1.18.0) whose CDN build is missing the
// `.jsep.mjs` file the library needs, so speech synthesis fails outright.
// We override it to match the onnxruntime-web version we actually
// install (see package.json), which does ship that file.
const ONNX_RUNTIME_VERSION = '1.27.0'
const ONNX_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_RUNTIME_VERSION}/dist/`

/**
 * TTS engine backed by Piper (open source neural TTS) running fully
 * in-browser via ONNX Runtime Web + WebAssembly — no server, no API key.
 * Sounds far more natural than the OS/browser voices used by the Web
 * Speech engine. The voice model downloads once (cached by the browser)
 * and works offline after that.
 *
 * @returns {import('./TTSEngine').TTSEngine | null} null if unsupported.
 */
export function createPiperEngine() {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null
  }

  let voiceId = localStorage.getItem(STORAGE_KEY) || TTS_CONFIG.piperDefaultVoiceId
  let rate = TTS_CONFIG.rate
  let volume = TTS_CONFIG.volume
  let currentAudio = null

  const getSession = (forVoiceId) => TtsSession.create({
    voiceId: forVoiceId,
    wasmPaths: {
      onnxWasm: ONNX_BASE,
      piperData: TtsSession.WASM_LOCATIONS.piperData,
      piperWasm: TtsSession.WASM_LOCATIONS.piperWasm,
    },
  })

  return {
    async speak(text, opts = {}) {
      const session = await getSession(voiceId)
      const wavBlob = await session.predict(text)
      const url = URL.createObjectURL(wavBlob)

      return new Promise((resolve, reject) => {
        const audio = new Audio(url)
        currentAudio = audio
        audio.volume = opts.volume ?? volume
        audio.playbackRate = opts.rate ?? rate
        audio.onended = () => { URL.revokeObjectURL(url); resolve() }
        audio.onerror = () => { URL.revokeObjectURL(url); resolve() } // treat as "stopped", not fatal
        audio.play().catch(() => resolve())
      })
    },

    stop() {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
        currentAudio = null
      }
    },

    async listVoices() {
      // Prefer the curated list in config.js (known-good Spanish voices);
      // fall back to whatever Piper's full catalog reports if it's ever empty.
      if (TTS_CONFIG.piperVoices?.length) {
        return TTS_CONFIG.piperVoices.map((v) => ({ id: v.id, name: v.label, lang: v.id.slice(0, 5) }))
      }
      const all = await fetchPiperVoices()
      return all
        .filter((v) => v.language?.code?.startsWith('es'))
        .map((v) => ({ id: v.key, name: v.name, lang: v.language.code }))
    },

    async setVoice(id) {
      if (!id || id === 'female_default') return
      voiceId = id
      localStorage.setItem(STORAGE_KEY, id)
    },

    setRate(value) { rate = value },
    setVolume(value) { volume = value },
    setPitch() { /* Piper's pitch is baked into the voice model; no runtime control. */ },
  }
}

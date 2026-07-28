import { TTS_CONFIG } from './config'

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents for loose matching
}

/**
 * Picks the warmest available Spanish female voice from a voice list.
 * Falls back progressively: hinted Spanish female voice -> any Spanish
 * voice -> any voice at all -> null (no voices available).
 *
 * @param {SpeechSynthesisVoice[]} voices
 * @returns {SpeechSynthesisVoice|null}
 */
export function pickBestSpanishFemaleVoice(voices) {
  if (!voices || voices.length === 0) return null

  const spanish = voices.filter((v) => v.lang?.toLowerCase().startsWith('es'))
  const pool = spanish.length ? spanish : voices

  for (const hint of TTS_CONFIG.femaleVoiceHints) {
    const match = pool.find((v) => normalize(v.name).includes(hint))
    if (match) return match
  }

  return pool[0] || voices[0] || null
}

/**
 * Resolves a symbolic voice id (e.g. "female_default") or a raw engine
 * voice identifier/name to an actual voice object.
 *
 * @param {string} voiceId
 * @param {SpeechSynthesisVoice[]} voices
 * @returns {SpeechSynthesisVoice|null}
 */
export function resolveVoice(voiceId, voices) {
  if (!voiceId || voiceId === TTS_CONFIG.defaultVoiceId) {
    return pickBestSpanishFemaleVoice(voices)
  }
  return (
    voices.find((v) => v.voiceURI === voiceId || v.name === voiceId) ||
    pickBestSpanishFemaleVoice(voices)
  )
}

/**
 * Common contract every TTS engine must implement.
 *
 * The rest of the app never talks to an engine directly — only to
 * `src/tts/index.js`, which wraps whichever engine is active. To replace
 * the engine in the future (e.g. swap Web Speech API for a Piper/WASM
 * engine), implement this same shape in a new file under `engines/` and
 * point `index.js` at it. Nothing outside `src/tts/` needs to change.
 *
 * @typedef {Object} TTSEngine
 * @property {(text: string, opts?: {rate?: number, pitch?: number, volume?: number}) => Promise<void>} speak
 *   Speaks `text` and resolves when playback finishes (or rejects on error).
 * @property {() => void} stop
 *   Immediately stops whatever this engine is currently speaking.
 * @property {() => Promise<Array<{id: string, name: string, lang: string}>>} listVoices
 *   Lists voices available to this engine (filtered to Spanish where possible).
 * @property {(voiceId: string) => Promise<void>} setVoice
 *   Selects a voice by id/name, or the symbolic id "female_default".
 * @property {(rate: number) => void} setRate
 * @property {(volume: number) => void} setVolume
 * @property {(pitch: number) => void} setPitch
 */

export {}

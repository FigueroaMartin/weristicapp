// Central TTS configuration.
// This is the only file most future tuning (voice, speed, volume defaults)
// should ever require touching.

export const TTS_CONFIG = {
  // Preferred language/locale for voice selection.
  lang: 'es-ES',

  // Default playback parameters (Web Speech API ranges).
  rate: 1, // 0.1 - 10, 1 = normal speed
  pitch: 1.05, // 0 - 2, slightly above 1 = warmer/friendlier tone
  volume: 1, // 0 - 1

  // Keyword hints (lowercase, no accents needed — matching is accent-insensitive)
  // used to auto-pick the warmest, most natural-sounding Spanish female voice
  // among whatever voices the device/browser exposes. Order = preference.
  // Covers common names shipped by Android (Google TTS), iOS/macOS (Siri/Apple
  // voices) and Windows/Edge (Microsoft Natural voices).
  femaleVoiceHints: [
    'paulina', 'monica', 'helena', 'lucia', 'sabina', 'elvira',
    'esperanza', 'marisol', 'raquel', 'camila', 'valentina',
    'female', 'mujer', 'femenina', 'natural',
  ],

  // Symbolic voice id the rest of the app should use instead of a raw
  // engine-specific voice name. The active engine resolves this to a real
  // voice via voiceSelector.js. (Only used by the Web Speech engine.)
  defaultVoiceId: 'female_default',

  // --- Piper engine (current default, see engines/piperEngine.js) -------
  // Spanish voices shipped by @mintplex-labs/piper-tts-web (MIT, runs
  // fully offline in-browser via ONNX). Full catalog:
  // https://huggingface.co/diffusionstudio/piper-voices
  // Each voice model downloads once (~15-60MB) and is cached by the
  // browser (OPFS) — after that it works fully offline.
  piperVoices: [
    { id: 'es_AR-daniela-high', label: 'Daniela (Argentina, alta calidad)' },
    { id: 'es_MX-claude-high', label: 'Claude (México, alta calidad)' },
    { id: 'es_ES-davefx-medium', label: 'Davefx (España)' },
    { id: 'es_ES-sharvard-medium', label: 'Sharvard (España)' },
    { id: 'es_MX-ald-medium', label: 'Ald (México)' },
    { id: 'es_ES-mls_9972-low', label: 'MLS 9972 (España)' },
    { id: 'es_ES-mls_10246-low', label: 'MLS 10246 (España)' },
    { id: 'es_ES-carlfm-x_low', label: 'Carlfm (España, rápida)' },
  ],
  piperDefaultVoiceId: 'es_AR-daniela-high',
}

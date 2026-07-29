# Módulo TTS (`src/tts/`)

Text-to-Speech local para el Asistente Vaca (Lya), vía Web Speech API
(motor nativo del navegador/SO). Sin servidor, sin API key, sin costo ni
descargas — funciona offline y es 100% confiable en cualquier navegador
moderno.

## Se probó Piper (neuronal) y se descartó

Se intentó reemplazar Web Speech por [Piper](https://github.com/rhasspy/piper)
vía `@mintplex-labs/piper-tts-web` para sonar menos robótico, pero el paquete
tiene un bug real e irreparable desde afuera: hardcodea
`https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/` como CDN
del runtime ONNX, una URL cuyo build no incluye el archivo
`ort-wasm-simd-threaded.jsep.mjs` que necesita — la síntesis siempre falla
con "no available backend found". Se intentó sobreescribir esa ruta vía
`wasmPaths.onnxWasm`, pero `onnxruntime-web` internamente resuelve el
`.mjs` del backend WASM por su cuenta y **no respeta ese override para
todos los archivos que carga**, así que el fix no era confiable ni en dev
ni en producción. Se revirtió a Web Speech API.

| Motor | Por qué sí/no aplica |
|---|---|
| Piper (`@mintplex-labs/piper-tts-web`) | Descartado: bug de CDN roto en la librería, sin fix confiable. |
| Kokoro TTS | Requiere runtime Python/ONNX de cientos de MB, sin build WASM madura. |
| XTTS v2 / Fish Speech | Requieren backend Python con GPU. |
| ElevenLabs / Google / Azure TTS | Voz muy natural, pero de pago y con la API key expuesta en el código público de un sitio estático. |
| **Web Speech API (actual)** | Cero descarga, cero costo, 100% confiable. Suena a voz de sistema operativo, pero funciona siempre. |

## Uso

Todo el resto de la app importa **únicamente** `src/tts/index.js`:

```js
import { tts } from '../tts'

await tts.speak('Hola, soy Lya, tu asistente.')
tts.stopCurrent()        // corta lo que se está diciendo ahora
tts.stop()                // corta todo y vacía la cola
tts.isPlaying()            // true/false
await tts.listVoices()     // voces en español disponibles en este dispositivo
await tts.setVoice(voiceId) // cambia de voz (ids de listVoices())
tts.setRate(1.1)           // velocidad
tts.setVolume(0.8)         // volumen
tts.setPitch(1.05)         // tono
```

Varias llamadas a `speak()` se encolan y se reproducen una tras otra, nunca
se superponen.

La app no expone un selector de voz en la UI — el motor auto-elige la
mejor voz femenina en español disponible en el dispositivo (ver
`femaleVoiceHints` en `config.js`).

## Estructura

```
tts/
  config.js               # única fuente de verdad: idioma, velocidad,
                           # volumen, pitch, hints de voz femenina
  voiceSelector.js         # lógica de auto-selección de voz
  queue.js                 # cola de reproducción secuencial
  engines/
    TTSEngine.js            # contrato (JSDoc) que debe cumplir cualquier motor
    webSpeechEngine.js       # motor activo: voces del sistema
  index.js                  # fachada pública — lo único que se importa fuera de tts/
```

## Cómo ajustar la voz por defecto

Editar `femaleVoiceHints` en `config.js` — es una lista ordenada de
palabras clave (nombres de voces comunes en Android/iOS/Windows) usada
para elegir la voz más cálida disponible en el dispositivo del usuario.

## Cómo cambiar de motor en el futuro

En `src/tts/index.js`, cambiar únicamente esta línea:

```js
import { createWebSpeechEngine } from './engines/webSpeechEngine'
// por el motor nuevo que implemente el contrato de engines/TTSEngine.js
```

Nada fuera de `src/tts/` cambia.

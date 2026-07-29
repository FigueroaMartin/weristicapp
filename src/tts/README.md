# Módulo TTS (`src/tts/`)

Text-to-Speech local, gratuito y offline para el Asistente Vaca (Lya).

## Motor actual: Piper (neuronal, 100% en el navegador)

Se cambió de Web Speech API (voces del sistema, sonaban robóticas) a
**Piper** vía [`@mintplex-labs/piper-tts-web`](https://github.com/Mintplex-Labs/piper-tts-web)
(MIT), que corre el modelo neuronal ONNX de Piper directo en el navegador
con WebAssembly. No hay servidor, no hay API key, no hay costo por uso.

| Motor | Por qué sí/no aplica |
|---|---|
| Kokoro TTS | Requiere runtime Python/ONNX de cientos de MB, sin build WASM madura. |
| XTTS v2 (Coqui) | Modelo de +1.5GB, requiere PyTorch/servidor con GPU. |
| Fish Speech | Igual que XTTS: necesita backend Python con GPU. |
| ElevenLabs / Google / Azure TTS | Voz muy natural, pero de pago y con la API key expuesta en el código público de un sitio estático — alguien podría copiarla y gastar la cuota. |
| **Piper (elegido)** | Neuronal, calidad muy superior a las voces del sistema, corre offline tras la primera descarga, sin costo ni API key. |
| Web Speech API (motor anterior) | Sigue disponible como fallback documentado abajo — cero descarga, pero suena a voz de sistema operativo. |

**Trade-off aceptado**: la primera vez que Lya habla, el navegador descarga
el runtime ONNX (~25MB) y el modelo de voz elegido (~15-60MB según la voz).
Después queda cacheado por el navegador y funciona offline.

### Bug real encontrado y corregido

`@mintplex-labs/piper-tts-web` trae hardcodeado un CDN apuntando a
`onnxruntime-web@1.18.0`, versión cuyo build en ese CDN **no incluye** el
archivo `ort-wasm-simd-threaded.jsep.mjs` que la librería necesita — la
síntesis fallaba siempre con "no available backend found". `piperEngine.js`
sobreescribe esa ruta apuntando a la versión de `onnxruntime-web` que
realmente instalamos (ver `package.json`), verificada con
`https://cdn.jsdelivr.net/npm/onnxruntime-web@<version>/dist/` antes de
fijarla. Si en el futuro se actualiza la dependencia `onnxruntime-web`,
hay que actualizar `ONNX_RUNTIME_VERSION` en `piperEngine.js` a la misma
versión.

## Uso

Todo el resto de la app importa **únicamente** `src/tts/index.js`:

```js
import { tts } from '../tts'

await tts.speak('Hola, soy Lya, tu asistente.')
tts.stopCurrent()        // corta lo que se está diciendo ahora
tts.stop()                // corta todo y vacía la cola
tts.isPlaying()            // true/false
await tts.listVoices()     // voces en español disponibles
await tts.setVoice('es_MX-claude-high') // cambia de voz (persiste en localStorage)
tts.setRate(1.1)           // velocidad
tts.setVolume(0.8)         // volumen
```

Varias llamadas a `speak()` se encolan y se reproducen una tras otra, nunca
se superponen.

## Estructura

```
tts/
  config.js               # única fuente de verdad: idioma, velocidad,
                           # volumen, y catálogo de voces de Piper
  voiceSelector.js         # lógica de auto-selección de voz (motor Web Speech)
  queue.js                 # cola de reproducción secuencial
  engines/
    TTSEngine.js            # contrato (JSDoc) que debe cumplir cualquier motor
    piperEngine.js           # motor activo: Piper (neuronal, WASM)
    webSpeechEngine.js       # motor anterior: voces del sistema (fallback documentado)
  voices/                   # carpeta preparada para voces personalizadas futuras
    femenina/, vaca/, personalizada/
  index.js                  # fachada pública — lo único que se importa fuera de tts/
```

## Cómo cambiar la voz

Desde la app: burbuja de Lya → "¿Tienes alguna duda?" → **🎙️ Cambiar la voz
de Lya**. Cada dispositivo guarda su propia elección (localStorage), así
que cada uno puede elegir la que más le guste sin afectar al otro.

Para cambiar la voz **por defecto** (antes de elegir una), editar
`piperVoices`/`piperDefaultVoiceId` en `config.js`. Catálogo completo de
voces Piper: https://huggingface.co/diffusionstudio/piper-voices

## Cómo volver a Web Speech API (o sustituir el motor por otro)

En `src/tts/index.js`, cambiar únicamente esta línea:

```js
import { createPiperEngine } from './engines/piperEngine'
// por:
import { createWebSpeechEngine as createPiperEngine } from './engines/webSpeechEngine'
```

Nada fuera de `src/tts/` cambia. Cualquier motor nuevo solo necesita
implementar el contrato de `engines/TTSEngine.js`.

## Instalación / dependencias

```bash
npm install @mintplex-labs/piper-tts-web onnxruntime-web
```

Ya están en `package.json`. No hace falta descargar modelos a mano: se
descargan solos la primera vez que se usan y quedan cacheados por el
navegador (OPFS).

# Módulo TTS (`src/tts/`)

Text-to-Speech local, gratuito y offline para el Asistente Vaca (Ilía).

## Por qué Web Speech API y no Kokoro / XTTS v2 / Fish Speech / Piper

Este proyecto es un sitio **estático** (React + Vite, desplegado en GitHub
Pages, sin servidor propio). Eso descarta los motores neuronales pesados:

| Motor | Por qué no aplica aquí |
|---|---|
| Kokoro TTS | Requiere runtime Python/ONNX de cientos de MB, sin build WASM madura. |
| XTTS v2 (Coqui) | Modelo de +1.5GB, requiere PyTorch/servidor con GPU. |
| Fish Speech | Igual que XTTS: necesita backend Python con GPU. |
| Piper | El más liviano de los neuronales, pero sus puertos a WebAssembly son proyectos de comunidad poco maduros — riesgo real de romper el deploy sin forma de probar audio en este entorno. |

**Web Speech API** (`window.speechSynthesis`) es la única opción que corre
100% en el dispositivo del usuario, sin descargar nada, gratis, y con
voces en español ya de buena calidad en Android/iOS/desktop modernos.

## Uso

Todo el resto de la app importa **únicamente** `src/tts/index.js`:

```js
import { tts } from '../tts'

await tts.speak('Hola, soy Ilía, tu asistente.')
tts.stopCurrent()        // corta lo que se está diciendo ahora
tts.stop()                // corta todo y vacía la cola
tts.isPlaying()            // true/false
await tts.listVoices()     // voces en español disponibles en este dispositivo
await tts.setVoice('female_default') // vuelve a la voz cálida por defecto
tts.setRate(1.1)           // velocidad
tts.setVolume(0.8)         // volumen
tts.setPitch(1.05)         // tono
```

Varias llamadas a `speak()` se encolan y se reproducen una tras otra, nunca
se superponen.

## Estructura

```
tts/
  config.js               # única fuente de verdad: idioma, velocidad,
                           # volumen y palabras clave para elegir voz
  voiceSelector.js         # lógica para elegir la voz femenina más cálida
  queue.js                 # cola de reproducción secuencial
  engines/
    TTSEngine.js            # contrato (JSDoc) que debe cumplir cualquier motor
    webSpeechEngine.js       # motor activo: Web Speech API
  voices/                   # carpeta preparada para modelos de voz futuros
    femenina/, vaca/, personalizada/
  index.js                  # fachada pública — lo único que se importa fuera de tts/
```

## Cómo cambiar la voz por defecto

Editar `config.js`:

```js
export const TTS_CONFIG = {
  ...
  femaleVoiceHints: ['paulina', 'monica', ...], // agregar/reordenar nombres
}
```

El motor elige la primera voz en español cuyo nombre contenga alguno de
esos términos (sin importar mayúsculas/acentos). Para forzar una voz
específica en tiempo de ejecución:

```js
const voices = await tts.listVoices()
await tts.setVoice(voices[i].id)
```

## Cómo sustituir el motor por otro en el futuro (ej. Piper)

1. Crear `src/tts/engines/piperEngine.js` que implemente el mismo contrato
   que `engines/TTSEngine.js` (`speak`, `stop`, `listVoices`, `setVoice`,
   `setRate`, `setVolume`, `setPitch`).
2. En `src/tts/index.js`, cambiar únicamente esta línea:
   ```js
   import { createWebSpeechEngine } from './engines/webSpeechEngine'
   // por:
   import { createPiperEngine as createWebSpeechEngine } from './engines/piperEngine'
   ```
   (o renombrar la variable si se prefiere más claridad).
3. Nada fuera de `src/tts/` cambia — todos los `tts.speak(...)` del resto
   de la app siguen funcionando igual.

Los archivos de modelo/voz de un motor futuro (ej. `.onnx` de Piper) van en
`voices/` — ver `voices/README.md`.

## Instalación / dependencias

Ninguna. Web Speech API es una API nativa del navegador, no requiere
`npm install` ni descarga de modelos. Si en el futuro se agrega un motor
con dependencias (ej. `onnxruntime-web` para Piper), documentar aquí el
paso de instalación y hacer que `engines/<motor>Engine.js` verifique que
el modelo esté cacheado antes de usarlo, descargándolo la primera vez.

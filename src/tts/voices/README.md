# Voces

Esta carpeta queda preparada para cuando el motor TTS pase a ser un modelo
de voz neuronal (Piper, XTTS, etc.) que use archivos de modelo/voz reales
en vez de las voces del sistema operativo.

Estructura prevista:

```
voices/
  femenina/      # Voces femeninas neutrales (la que se usa por defecto)
  vaca/          # Voz personalizada del personaje "vaca" (Lya), si se
                 # entrena o consigue una voz con ese carácter específico
  personalizada/ # Cualquier otra voz a medida que se agregue más adelante
```

Cada subcarpeta debería contener, cuando aplique:

- El archivo de modelo de voz (ej. `.onnx` + `.onnx.json` en el caso de Piper).
- Una licencia de uso de esa voz.
- Un `meta.json` con `{ id, name, lang, gender, engine }` para que
  `voiceSelector.js` pueda listarla y resolverla igual que hace hoy con
  las voces del navegador.

Con la arquitectura actual (`src/tts/index.js` como única fachada), agregar
un motor que lea desde aquí no requiere cambiar nada fuera de `src/tts/`.
Ver `../README.md` para el paso a paso de cómo enchufar un nuevo motor.

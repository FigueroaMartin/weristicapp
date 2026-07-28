// Contenido del tutorial guiado de Lya, dividido en secciones.
// Cada paso se usa tanto para el recorrido inicial como para el menú
// de "¿Tienes alguna duda?" que aparece después de completarlo.

export const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: 'Bienvenida',
    text: 'Este es Weristicapp: la app donde llevamos juntos nuestras rutinas, finanzas, alimentación y recuerdos. Te cuento rápido qué hay en cada sección.',
  },
  {
    id: 'deporte',
    title: 'Deporte',
    text: 'En Deporte ves el plan de ejercicios de hoy. Cada ejercicio tiene un círculo que puedes tocar para marcarlo como completo, parcial o saltado. También llevas una racha por cumplir más del 50% del día, y puedes abrir el calendario para revisar cualquier día pasado o futuro.',
  },
  {
    id: 'finanzas',
    title: 'Finanzas',
    text: 'Finanzas está por venir: ahí vamos a llevar la cuenta conjunta, registrando los aportes y los gastos de cada salida.',
  },
  {
    id: 'alimentacion',
    title: 'Alimentación',
    text: 'Alimentación también está en camino, para registrar lo que comemos día a día.',
  },
  {
    id: 'galeria',
    title: 'Galería',
    text: 'Y en Galería vamos a poder subir las fotos que saquemos juntos, como una carpeta compartida entre los dos.',
  },
  {
    id: 'cierre',
    title: 'Listo',
    text: 'Eso es todo por ahora. Si en algún momento tienes dudas, solo presióname y te las explico de nuevo.',
  },
]

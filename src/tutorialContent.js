// Contenido del tutorial guiado de Lya, dividido en secciones.
// Cada paso puede incluir:
//   - action: instrucción que Lya envía a la app (cambiar de pestaña,
//     abrir un panel) para que el tutorial la muestre de verdad.
//   - target: id (data-tutorial-id) del elemento a resaltar en pantalla.
// El mismo arreglo alimenta tanto el recorrido inicial como el menú de
// "¿Tienes alguna duda?" que aparece después.

export const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: 'Bienvenida',
    text: 'Este es Weristicapp: la app donde llevamos juntos nuestras rutinas, finanzas, alimentación, panoramas y recuerdos. Te muestro rápido qué hay en cada parte.',
    action: { type: 'tab', value: 'deporte' },
  },
  {
    id: 'deporte-hoy',
    title: 'Plan de hoy',
    text: 'Esto es lo que hay que hacer hoy: tu rutina del día, con cada ejercicio marcable como completo, parcial o saltado.',
    target: 'today-plan',
  },
  {
    id: 'deporte-extra',
    title: 'Actividad extra',
    text: 'Esto es para agregar una actividad extra que hiciste fuera de la rutina, como salir a trotar.',
    target: 'actividad-extra',
    action: { type: 'open-extra' },
  },
  {
    id: 'deporte-calendario',
    title: 'Calendario',
    text: 'Y este es el calendario: puedes revisar o editar cualquier día, pasado o futuro.',
    target: 'calendario',
    action: { type: 'open-calendar' },
  },
  {
    id: 'finanzas',
    title: 'Finanzas',
    text: 'Finanzas está por venir: ahí vamos a llevar la cuenta conjunta, registrando aportes y gastos de cada salida.',
    action: { type: 'tab', value: 'finanzas' },
  },
  {
    id: 'alimentacion',
    title: 'Alimentación',
    text: 'Alimentación también está en camino, para registrar lo que comemos día a día.',
    action: { type: 'tab', value: 'alimentacion' },
  },
  {
    id: 'panoramas',
    title: 'Panoramas',
    text: 'En Panoramas guardamos las ideas de salidas y planes que queremos hacer juntos. Pueden agendarlos, marcarlos como hechos y, si no saben qué hacer, pedirme que sugiera uno al azar.',
    action: { type: 'tab', value: 'panoramas' },
  },
  {
    id: 'galeria',
    title: 'Galería',
    text: 'Y en Galería vamos a poder subir las fotos que saquemos juntos, como una carpeta compartida entre los dos.',
    action: { type: 'tab', value: 'galeria' },
  },
  {
    id: 'cierre',
    title: 'Listo',
    text: 'Eso es todo por ahora. Si en algún momento tienes dudas, solo presióname y te las explico de nuevo.',
    action: { type: 'restore' },
  },
]

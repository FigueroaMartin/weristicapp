// Returns null when the day requires no action (rest day / no exercises scheduled),
// or a 0-100 completion percentage for a training day.
export function dayCompletionPercent(date, exercises, statusByExerciseId) {
  const weekday = date.getDay()
  const dayExercises = exercises[weekday] || []
  if (dayExercises.length === 0) return null

  let score = 0
  dayExercises.forEach((ex) => {
    const status = statusByExerciseId[ex.id]
    if (status === 'completo') score += 1
    else if (status === 'parcial') score += 0.5
  })
  return (score / dayExercises.length) * 100
}

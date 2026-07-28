import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useRoutineData } from './useRoutineData'
import { toDateKey } from './dateUtils'
import { dayCompletionPercent } from './routineStats'

const LOOKBACK_DAYS = 90

export function useRoutineStreak(person) {
  const { exercises, loading } = useRoutineData(person)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!person || loading) return

    const ids = Object.values(exercises).flat().map((ex) => ex.id)
    if (ids.length === 0) { setStreak(0); return }

    const start = new Date()
    start.setDate(start.getDate() - LOOKBACK_DAYS)

    supabase
      .from('exercise_completions')
      .select('*')
      .in('exercise_id', ids)
      .gte('date', toDateKey(start))
      .then(({ data, error }) => {
        if (error) return
        const byDate = {}
        ;(data || []).forEach((c) => {
          if (!byDate[c.date]) byDate[c.date] = {}
          byDate[c.date][c.exercise_id] = c.status
        })

        let count = 0
        const cursor = new Date()
        for (let i = 0; i < LOOKBACK_DAYS; i++) {
          const key = toDateKey(cursor)
          const percent = dayCompletionPercent(cursor, exercises, byDate[key] || {})
          if (percent === null || percent > 50) count++
          else break
          cursor.setDate(cursor.getDate() - 1)
        }
        setStreak(count)
      })
  }, [person, loading, exercises])

  return streak
}

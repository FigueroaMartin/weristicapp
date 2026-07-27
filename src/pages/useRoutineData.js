import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useRoutineData(person) {
  const [routines, setRoutines] = useState({})
  const [exercises, setExercises] = useState({})
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!person) { setRoutines({}); setExercises({}); setLoading(false); return }
    setLoading(true)
    const [routineRes, exerciseRes] = await Promise.all([
      supabase.from('weekly_routine').select('*').eq('person', person),
      supabase.from('routine_exercises').select('*').eq('person', person).order('order_index', { ascending: true }),
    ])
    if (!routineRes.error && routineRes.data) {
      const byWeekday = {}
      routineRes.data.forEach((r) => { byWeekday[r.weekday] = r })
      setRoutines(byWeekday)
    }
    if (!exerciseRes.error && exerciseRes.data) {
      const byWeekday = {}
      exerciseRes.data.forEach((ex) => {
        if (!byWeekday[ex.weekday]) byWeekday[ex.weekday] = []
        byWeekday[ex.weekday].push(ex)
      })
      setExercises(byWeekday)
    }
    setLoading(false)
  }, [person])

  useEffect(() => { reload() }, [reload])

  return { routines, exercises, loading, reload }
}

import { useMemo } from 'react'
import { usePerson } from '../PersonContext'
import { useRoutineData } from './useRoutineData'
import RoutineDayDetail from './RoutineDayDetail'

export default function TodayPlan({ logs = [] }) {
  const { person } = usePerson()
  const { routines, exercises, loading, reload } = useRoutineData(person)
  const today = useMemo(() => new Date(), [])

  if (!person) {
    return (
      <div className="card">
        <p className="empty">Elige tu perfil (Martín o Micaella) arriba para ver el plan de hoy.</p>
      </div>
    )
  }

  return (
    <div className="card detail-card">
      <RoutineDayDetail
        person={person}
        date={today}
        routines={routines}
        exercises={exercises}
        loading={loading}
        logs={logs}
        onChanged={reload}
      />
    </div>
  )
}

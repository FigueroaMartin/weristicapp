import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { usePerson } from '../PersonContext'
import { useRoutineData } from './useRoutineData'
import { WEEKDAY_FULL } from './dateUtils'

let tempIdCounter = 0
const nextTempId = () => `tmp-${++tempIdCounter}`

// Monday..Sunday, matching how days read naturally in a weekly planner.
const ORDER = [1, 2, 3, 4, 5, 6, 0]

function buildDayForm(routine, dayExercises) {
  return {
    title: routine?.title || '',
    description: routine?.description || '',
    isRest: routine ? routine.is_rest : true,
    exercises: (dayExercises || []).map((ex) => ({ ...ex })),
  }
}

/**
 * Panel de administrador: edita la rutina semanal completa (los 7 días)
 * de una vez, en vez de un día a la vez como en el calendario. Los
 * cambios se guardan por día y quedan activos de inmediato.
 */
export default function RoutinePlanner({ onClose }) {
  const { person } = usePerson()
  const { routines, exercises, loading, reload } = useRoutineData(person)
  const [days, setDays] = useState({})
  const [savingDay, setSavingDay] = useState(null)
  const [copyTarget, setCopyTarget] = useState({})

  useEffect(() => {
    if (loading) return
    const initial = {}
    ORDER.forEach((wd) => { initial[wd] = buildDayForm(routines[wd], exercises[wd]) })
    setDays(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, routines, exercises])

  const updateDay = (wd, patch) => setDays((prev) => ({ ...prev, [wd]: { ...prev[wd], ...patch } }))

  const addExercise = (wd) => updateDay(wd, {
    exercises: [...days[wd].exercises, { id: nextTempId(), name: '', sets: '', reps: '', notes: '' }],
  })
  const updateExercise = (wd, id, field, value) => updateDay(wd, {
    exercises: days[wd].exercises.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)),
  })
  const removeExercise = (wd, id) => updateDay(wd, {
    exercises: days[wd].exercises.filter((ex) => ex.id !== id),
  })

  const copyDay = (fromWd) => {
    const toWd = Number(copyTarget[fromWd])
    if (Number.isNaN(toWd)) return
    setDays((prev) => ({
      ...prev,
      [toWd]: {
        title: prev[fromWd].title,
        description: prev[fromWd].description,
        isRest: prev[fromWd].isRest,
        exercises: prev[fromWd].exercises.map((ex) => ({ ...ex, id: nextTempId() })),
      },
    }))
    setCopyTarget((prev) => ({ ...prev, [fromWd]: '' }))
  }

  const saveDay = async (wd) => {
    if (!person) return
    setSavingDay(wd)
    const day = days[wd]

    const { error: routineError } = await supabase.from('weekly_routine').upsert({
      weekday: wd,
      person,
      title: day.title.trim(),
      description: day.description.trim(),
      is_rest: day.isRest,
      updated_at: new Date().toISOString(),
    })

    const existingIds = (exercises[wd] || []).map((ex) => ex.id)
    const keptIds = day.exercises.filter((ex) => !String(ex.id).startsWith('tmp-')).map((ex) => ex.id)
    const removedIds = existingIds.filter((id) => !keptIds.includes(id))
    if (removedIds.length > 0) {
      await supabase.from('routine_exercises').delete().in('id', removedIds)
    }

    const cleanExercises = day.isRest ? [] : day.exercises.filter((ex) => ex.name.trim())
    for (let i = 0; i < cleanExercises.length; i++) {
      const ex = cleanExercises[i]
      const payload = {
        weekday: wd,
        person,
        name: ex.name.trim(),
        sets: ex.sets ? Number(ex.sets) : null,
        reps: ex.reps ? String(ex.reps).trim() : null,
        notes: ex.notes ? String(ex.notes).trim() : null,
        order_index: i,
      }
      if (!String(ex.id).startsWith('tmp-')) payload.id = ex.id
      await supabase.from('routine_exercises').upsert(payload)
    }
    if (day.isRest && existingIds.length > 0) {
      await supabase.from('routine_exercises').delete().in('id', existingIds)
    }

    setSavingDay(null)
    if (!routineError) reload()
  }

  return (
    <div className="planner-overlay" onClick={onClose}>
      <div className="planner-panel" onClick={(e) => e.stopPropagation()}>
        <div className="planner-header">
          <div>
            <h2>📋 Planificador{person ? ` — ${person}` : ''}</h2>
            <p className="planner-subtitle">Define la rutina semanal completa. Los cambios se aplican de inmediato.</p>
          </div>
          <button type="button" className="planner-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {!person ? (
          <p className="empty">Elige tu perfil arriba para planificar tu rutina.</p>
        ) : loading ? (
          <p className="empty">Cargando…</p>
        ) : (
          <div className="planner-days">
            {ORDER.map((wd) => {
              const day = days[wd]
              if (!day) return null
              return (
                <div key={wd} className="planner-day card">
                  <div className="planner-day-header">
                    <strong>{WEEKDAY_FULL[wd]}</strong>
                    <label className="checkbox-row">
                      <input type="checkbox" checked={day.isRest} onChange={(e) => updateDay(wd, { isRest: e.target.checked })} />
                      Descanso
                    </label>
                  </div>

                  {!day.isRest && (
                    <>
                      <label>
                        Rutina
                        <input value={day.title} onChange={(e) => updateDay(wd, { title: e.target.value })} placeholder="Ej: Piernas y glúteos" />
                      </label>

                      <div className="exercise-editor">
                        <span className="exercise-editor-label">Ejercicios</span>
                        {day.exercises.map((ex) => (
                          <div key={ex.id} className="exercise-row">
                            <input
                              className="exercise-name"
                              value={ex.name}
                              onChange={(e) => updateExercise(wd, ex.id, 'name', e.target.value)}
                              placeholder="Ej: Sentadillas"
                            />
                            <input
                              className="exercise-sets"
                              value={ex.sets ?? ''}
                              onChange={(e) => updateExercise(wd, ex.id, 'sets', e.target.value)}
                              placeholder="Series"
                              inputMode="numeric"
                            />
                            <input
                              className="exercise-reps"
                              value={ex.reps ?? ''}
                              onChange={(e) => updateExercise(wd, ex.id, 'reps', e.target.value)}
                              placeholder="Reps"
                            />
                            <input
                              className="exercise-notes"
                              value={ex.notes ?? ''}
                              onChange={(e) => updateExercise(wd, ex.id, 'notes', e.target.value)}
                              placeholder="Peso/nota"
                            />
                            <button type="button" className="exercise-remove" onClick={() => removeExercise(wd, ex.id)}>✕</button>
                          </div>
                        ))}
                        <button type="button" className="link-btn" onClick={() => addExercise(wd)}>+ Agregar ejercicio</button>
                      </div>
                    </>
                  )}

                  <label>
                    {day.isRest ? 'Recomendación personalizada (opcional)' : 'Nota general (opcional)'}
                    <textarea rows={2} value={day.description} onChange={(e) => updateDay(wd, { description: e.target.value })} />
                  </label>

                  <div className="planner-day-actions">
                    <div className="planner-copy">
                      <select value={copyTarget[wd] ?? ''} onChange={(e) => setCopyTarget((prev) => ({ ...prev, [wd]: e.target.value }))}>
                        <option value="">Copiar a…</option>
                        {ORDER.filter((w) => w !== wd).map((w) => (
                          <option key={w} value={w}>{WEEKDAY_FULL[w]}</option>
                        ))}
                      </select>
                      <button type="button" className="toggle-group-btn" disabled={!copyTarget[wd]} onClick={() => copyDay(wd)}>Copiar</button>
                    </div>
                    <button type="button" className="primary" disabled={savingDay === wd} onClick={() => saveDay(wd)}>
                      {savingDay === wd ? 'Guardando…' : 'Guardar día'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

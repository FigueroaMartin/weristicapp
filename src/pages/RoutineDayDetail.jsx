import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { sameDay, toDateKey, WEEKDAY_FULL, MONTH_NAMES } from './dateUtils'

const REST_TIPS = [
  'Duerme entre 7 y 8 horas para una buena recuperación muscular.',
  'Hidrátate bien durante el día y prioriza proteína en las comidas.',
  'Haz estiramientos suaves, movilidad o una caminata ligera.',
  'Evita cargas intensas hoy: deja que el cuerpo se recupere.',
]

const STATUS_CYCLE = [null, 'completo', 'parcial', 'saltado']
const STATUS_LABEL = { completo: 'Completo', parcial: 'Parcial', saltado: 'Saltado' }

let tempIdCounter = 0
const nextTempId = () => `tmp-${++tempIdCounter}`

export default function RoutineDayDetail({ person, date, routines, exercises, loading, logs = [], onChanged, onCompletionChanged }) {
  const weekday = date.getDay()
  const routine = routines[weekday]
  const dayExercises = exercises[weekday] || []
  const dateKey = toDateKey(date)
  const isToday = sameDay(date, new Date())

  const [completions, setCompletions] = useState({})
  const [weights, setWeights] = useState({})
  const [weightDrafts, setWeightDrafts] = useState({})
  const touchedWeights = useRef({})
  const [editing, setEditing] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIsRest, setFormIsRest] = useState(true)
  const [formExercises, setFormExercises] = useState([])
  const [saving, setSaving] = useState(false)

  const loadCompletions = async (key) => {
    const { data, error } = await supabase.from('exercise_completions').select('*').eq('date', key)
    if (!error && data) {
      const byExercise = {}
      data.forEach((c) => { byExercise[c.exercise_id] = c.status })
      setCompletions(byExercise)
    } else {
      setCompletions({})
    }
  }

  useEffect(() => { loadCompletions(dateKey) }, [dateKey])

  const loadWeights = async () => {
    const ids = dayExercises.map((ex) => ex.id)
    setWeightDrafts({})
    touchedWeights.current = {}
    if (ids.length === 0) { setWeights({}); return }
    const { data, error } = await supabase
      .from('exercise_weights')
      .select('*')
      .in('exercise_id', ids)
      .lte('date', dateKey)
      .order('date', { ascending: false })
    if (error || !data) { setWeights({}); return }
    const latestByExercise = {}
    data.forEach((row) => {
      if (!latestByExercise[row.exercise_id]) latestByExercise[row.exercise_id] = row
    })
    setWeights(latestByExercise)
  }

  useEffect(() => { loadWeights() }, [dateKey, weekday, exercises])

  useEffect(() => {
    setEditing(false)
    if (routine) {
      setFormTitle(routine.title || '')
      setFormDescription(routine.description || '')
      setFormIsRest(routine.is_rest)
    } else {
      setFormTitle('')
      setFormDescription('')
      setFormIsRest(true)
    }
    setFormExercises(dayExercises.map((ex) => ({ ...ex })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekday, routine])

  const dayLogs = logs.filter((l) => l.person === person && toDateKey(new Date(l.created_at)) === dateKey)

  const startEditing = () => {
    setFormExercises(dayExercises.map((ex) => ({ ...ex })))
    setEditing(true)
  }

  const addExerciseRow = () => {
    setFormExercises((prev) => [...prev, { id: nextTempId(), name: '', sets: '', reps: '', notes: '' }])
  }
  const updateExerciseRow = (id, field, value) => {
    setFormExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)))
  }
  const removeExerciseRow = (id) => {
    setFormExercises((prev) => prev.filter((ex) => ex.id !== id))
  }

  const cycleCompletion = async (exerciseId) => {
    const current = completions[exerciseId] || null
    const currentIndex = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]

    setCompletions((prev) => {
      const copy = { ...prev }
      if (next) copy[exerciseId] = next
      else delete copy[exerciseId]
      return copy
    })

    if (next) {
      await supabase.from('exercise_completions').upsert(
        { exercise_id: exerciseId, date: dateKey, status: next, updated_at: new Date().toISOString() },
        { onConflict: 'exercise_id,date' }
      )
    } else {
      await supabase.from('exercise_completions').delete().eq('exercise_id', exerciseId).eq('date', dateKey)
    }
    onCompletionChanged?.()
  }

  const handleWeightChange = (exerciseId, value) => {
    touchedWeights.current[exerciseId] = true
    setWeightDrafts((prev) => ({ ...prev, [exerciseId]: value }))
  }

  const handleWeightBlur = async (exerciseId, rawValue) => {
    if (!touchedWeights.current[exerciseId]) return // never edited, nothing to save
    delete touchedWeights.current[exerciseId]

    // Read the value straight from the input rather than from the
    // `weightDrafts` state: if input+blur happen in the same batch (e.g.
    // fast typing followed immediately by tabbing away), the state from
    // onChange may not have flushed yet by the time this closure runs.
    const trimmed = rawValue.trim()
    const existing = weights[exerciseId]
    const existingIsToday = existing?.date === dateKey

    if (trimmed === '') {
      if (existingIsToday) {
        await supabase.from('exercise_weights').delete().eq('exercise_id', exerciseId).eq('date', dateKey)
        const { data } = await supabase
          .from('exercise_weights')
          .select('*')
          .eq('exercise_id', exerciseId)
          .lte('date', dateKey)
          .order('date', { ascending: false })
          .limit(1)
        setWeights((prev) => {
          const copy = { ...prev }
          if (data?.[0]) copy[exerciseId] = data[0]
          else delete copy[exerciseId]
          return copy
        })
      }
      setWeightDrafts((prev) => { const copy = { ...prev }; delete copy[exerciseId]; return copy })
      return
    }

    if (existingIsToday && existing.weight === trimmed) {
      setWeightDrafts((prev) => { const copy = { ...prev }; delete copy[exerciseId]; return copy })
      return
    }

    await supabase.from('exercise_weights').upsert(
      { exercise_id: exerciseId, date: dateKey, weight: trimmed, updated_at: new Date().toISOString() },
      { onConflict: 'exercise_id,date' }
    )
    setWeights((prev) => ({ ...prev, [exerciseId]: { exercise_id: exerciseId, date: dateKey, weight: trimmed } }))
    setWeightDrafts((prev) => { const copy = { ...prev }; delete copy[exerciseId]; return copy })
  }

  const handleSaveRoutine = async () => {
    if (!person) return
    setSaving(true)

    const { error: routineError } = await supabase.from('weekly_routine').upsert({
      weekday,
      person,
      title: formTitle.trim(),
      description: formDescription.trim(),
      is_rest: formIsRest,
      updated_at: new Date().toISOString(),
    })

    const existingIds = dayExercises.map((ex) => ex.id)
    const keptIds = formExercises.filter((ex) => !String(ex.id).startsWith('tmp-')).map((ex) => ex.id)
    const removedIds = existingIds.filter((id) => !keptIds.includes(id))

    if (removedIds.length > 0) {
      await supabase.from('routine_exercises').delete().in('id', removedIds)
    }

    const cleanExercises = formIsRest
      ? []
      : formExercises.filter((ex) => ex.name.trim())

    for (let i = 0; i < cleanExercises.length; i++) {
      const ex = cleanExercises[i]
      const payload = {
        weekday,
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
    if (formIsRest && existingIds.length > 0) {
      await supabase.from('routine_exercises').delete().in('id', existingIds)
    }

    setSaving(false)
    if (!routineError) {
      setEditing(false)
      onChanged?.()
    }
  }

  return (
    <div className="routine-detail">
      <div className="routine-detail-header">
        <strong>{isToday ? 'Hoy' : `${WEEKDAY_FULL[weekday]} ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}`}</strong>
        {!editing && !loading && (
          <button type="button" className="link-btn" onClick={startEditing}>Editar</button>
        )}
      </div>

      {loading ? (
        <p className="empty">Cargando rutina…</p>
      ) : editing ? (
        <div className="routine-edit-form">
          <label className="checkbox-row">
            <input type="checkbox" checked={formIsRest} onChange={(e) => setFormIsRest(e.target.checked)} />
            Es día de descanso
          </label>
          {!formIsRest && (
            <>
              <label>
                Rutina
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej: Piernas y glúteos" />
              </label>

              <div className="exercise-editor">
                <span className="exercise-editor-label">Ejercicios</span>
                {formExercises.map((ex) => (
                  <div key={ex.id} className="exercise-row">
                    <input
                      className="exercise-name"
                      value={ex.name}
                      onChange={(e) => updateExerciseRow(ex.id, 'name', e.target.value)}
                      placeholder="Ej: Sentadillas"
                    />
                    <input
                      className="exercise-sets"
                      value={ex.sets ?? ''}
                      onChange={(e) => updateExerciseRow(ex.id, 'sets', e.target.value)}
                      placeholder="Series"
                      inputMode="numeric"
                    />
                    <input
                      className="exercise-reps"
                      value={ex.reps ?? ''}
                      onChange={(e) => updateExerciseRow(ex.id, 'reps', e.target.value)}
                      placeholder="Reps"
                    />
                    <input
                      className="exercise-notes"
                      value={ex.notes ?? ''}
                      onChange={(e) => updateExerciseRow(ex.id, 'notes', e.target.value)}
                      placeholder="Peso/nota"
                    />
                    <button type="button" className="exercise-remove" onClick={() => removeExerciseRow(ex.id)}>✕</button>
                  </div>
                ))}
                <button type="button" className="link-btn" onClick={addExerciseRow}>+ Agregar ejercicio</button>
              </div>
            </>
          )}
          <label>
            {formIsRest ? 'Recomendación personalizada (opcional)' : 'Nota general (opcional)'}
            <textarea rows={3} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder={formIsRest ? 'Ej: hoy toca solo estiramientos' : 'Ej: calentamiento, enfoque técnico...'} />
          </label>
          <div className="routine-edit-actions">
            <button type="button" className="toggle-group-btn" onClick={() => setEditing(false)}>Cancelar</button>
            <button type="button" className="primary" disabled={saving} onClick={handleSaveRoutine}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : routine && !routine.is_rest && routine.title ? (
        <div className="routine-info">
          <span className="routine-badge active">Toca entrenar</span>
          <h4>{routine.title}</h4>
          {routine.description && <p>{routine.description}</p>}
          {dayExercises.length > 0 ? (
            <ul className="exercise-list">
              {dayExercises.map((ex) => {
                const status = completions[ex.id] || null
                return (
                  <li key={ex.id} className="exercise-list-item" onClick={() => cycleCompletion(ex.id)}>
                    <span className={`status-check ${status || 'none'}`} title="Marcar avance">
                      {status === 'completo' && '✓'}
                      {status === 'parcial' && '½'}
                      {status === 'saltado' && '✕'}
                    </span>
                    <div className="exercise-list-main">
                      <span className="exercise-list-name">{ex.name}</span>
                      {status && <span className={`status-label ${status}`}>{STATUS_LABEL[status]}</span>}
                    </div>
                    <div className="exercise-list-side">
                      <span className="exercise-list-meta">
                        {ex.sets ? `${ex.sets} series` : ''}{ex.sets && ex.reps ? ' · ' : ''}{ex.reps ? `${ex.reps} reps` : ''}
                      </span>
                      <div className="exercise-weight-field" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="exercise-weight-input"
                          placeholder="Peso"
                          value={weightDrafts[ex.id] ?? weights[ex.id]?.weight ?? ''}
                          onChange={(e) => handleWeightChange(ex.id, e.target.value)}
                          onBlur={(e) => handleWeightBlur(ex.id, e.target.value)}
                        />
                        <span className="exercise-weight-suffix">Kg</span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="empty">Sin ejercicios cargados. Presiona "Editar" para agregarlos.</p>
          )}
        </div>
      ) : (
        <div className="routine-info">
          <span className="routine-badge rest">Día de descanso</span>
          {routine?.description && <p>{routine.description}</p>}
          <ul className="rest-tips">
            {REST_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
      )}

      {!loading && !editing && (
        <div className="day-logs">
          <span className="exercise-editor-label">Actividad extra ese día</span>
          {dayLogs.length > 0 ? (
            <ul className="list">
              {dayLogs.map((l) => (
                <li key={l.id} className="list-item">
                  <div>
                    <strong>{l.completed ? '✅' : '⭕'} {l.activity}</strong>
                    <div className="meta">{l.duration_min ? `${l.duration_min} min · ` : ''}{new Date(l.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Sin actividad extra registrada este día.</p>
          )}
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { usePerson } from '../PersonContext'
import RoutineCalendar from './RoutineCalendar'
import TodayPlan from './TodayPlan'

export default function Deporte() {
  const { person } = usePerson()
  const [logs, setLogs] = useState([])
  const [activity, setActivity] = useState('')
  const [duration, setDuration] = useState('')
  const [completed, setCompleted] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showExtra, setShowExtra] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarRef = useRef(null)

  useEffect(() => {
    if (calendarOpen && calendarRef.current) {
      calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [calendarOpen])

  const load = async () => {
    const { data, error } = await supabase
      .from('sport_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) setError(error.message)
    else setLogs(data)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!person) { setError('Elige quién eres arriba.'); return }
    if (!activity.trim()) { setError('Escribe la actividad.'); return }

    setSaving(true)
    const { error } = await supabase.from('sport_logs').insert({
      person,
      activity: activity.trim(),
      duration_min: duration ? Number(duration) : null,
      completed,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setActivity('')
    setDuration('')
    setShowExtra(false)
    load()
  }

  const streak = (name) => {
    const days = new Set(
      logs.filter((l) => l.person === name && l.completed).map((l) => new Date(l.created_at).toDateString())
    )
    let count = 0
    let cursor = new Date()
    while (days.has(cursor.toDateString())) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }

  const people = [...new Set(logs.map((l) => l.person))]

  return (
    <div className="page">
      <h2>🏃 Deporte</h2>

      {people.length > 0 && (
        <div className="card">
          {people.map((p) => (
            <div key={p} className="balance-row">
              <strong>{p}</strong>
              <span>🔥 racha de {streak(p)} día{streak(p) === 1 ? '' : 's'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sport-flow">
        <div className="flow-item" style={{ order: 1, display: calendarOpen ? 'none' : 'block' }}>
          <TodayPlan logs={logs} />
        </div>

        <div className="flow-item" style={{ order: 2 }}>
          <div className="card collapsible-card">
            <button type="button" className="collapsible-toggle" onClick={() => setShowExtra((v) => !v)}>
              <span>➕ Actividad extra</span>
              <span className={`collapsible-chevron ${showExtra ? 'open' : ''}`}>▾</span>
            </button>

            {showExtra && (
              <form className="collapsible-body" onSubmit={handleSubmit}>
                <label>
                  Actividad
                  <input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Trote, gym, yoga…" required />
                </label>

                <label>
                  Duración (min, opcional)
                  <input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" />
                </label>

                <label className="checkbox-row">
                  <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
                  Cumplí hoy
                </label>

                {error && <p className="error">{error}</p>}

                <button type="submit" className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Registrar actividad extra'}</button>
              </form>
            )}
          </div>
        </div>

        <div className="flow-item" style={{ order: calendarOpen ? 0 : 3 }} ref={calendarRef}>
          <RoutineCalendar logs={logs} open={calendarOpen} onToggle={setCalendarOpen} />
        </div>
      </div>
    </div>
  )
}

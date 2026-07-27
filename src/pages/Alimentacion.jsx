import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { usePerson } from '../PersonContext'

const MEALS = [
  { value: 'desayuno', label: '🥐 Desayuno' },
  { value: 'almuerzo', label: '🍲 Almuerzo' },
  { value: 'cena', label: '🍽️ Cena' },
  { value: 'snack', label: '🍎 Snack' },
]

export default function Alimentacion() {
  const { person } = usePerson()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [mealType, setMealType] = useState('almuerzo')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) setError(error.message)
    else setLogs(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!person) { setError('Elige quién eres arriba.'); return }

    setSaving(true)
    const { error } = await supabase.from('food_logs').insert({
      person,
      meal_type: mealType,
      note: note.trim(),
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setNote('')
    load()
  }

  const today = new Date().toDateString()
  const todayLogs = logs.filter((l) => new Date(l.created_at).toDateString() === today)

  return (
    <div className="page">
      <h2>🥗 Alimentación</h2>

      <div className="page-grid">
        <div className="col-form">
          <div className="card">
            <strong>Hoy registraron:</strong>
            <div className="chips">
              {MEALS.map((m) => {
                const count = todayLogs.filter((l) => l.meal_type === m.value).length
                return <span key={m.value} className={`chip ${count > 0 ? 'chip-on' : ''}`}>{m.label} {count > 0 ? `(${count})` : ''}</span>
              })}
            </div>
          </div>

          <form className="card" onSubmit={handleSubmit}>
            <label>
              Comida
              <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                {MEALS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>

            <label>
              Nota (opcional)
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ensalada + pollo" />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Registrar comida'}</button>
          </form>
        </div>

        <div className="col-list">
          <h3>Historial</h3>
          {loading ? <p>Cargando…</p> : (
            <ul className="list">
              {logs.map((l) => (
                <li key={l.id} className="list-item">
                  <div>
                    <strong>{MEALS.find((m) => m.value === l.meal_type)?.label}</strong>
                    <div className="meta">{l.person}{l.note ? ` · ${l.note}` : ''} · {new Date(l.created_at).toLocaleString('es-CL')}</div>
                  </div>
                </li>
              ))}
              {!loading && logs.length === 0 && <p className="empty">Aún no hay registros.</p>}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

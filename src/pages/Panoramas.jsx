import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { usePerson } from '../PersonContext'
import { toDateKey } from './dateUtils'
import PanoramaRoute from './PanoramaRoute'

const CATEGORIES = [
  { value: 'comida', label: '🍽️ Comida' },
  { value: 'aire-libre', label: '🌳 Aire libre' },
  { value: 'cultura', label: '🎭 Cultura' },
  { value: 'viaje', label: '✈️ Viaje' },
  { value: 'en-casa', label: '🏠 En casa' },
  { value: 'otro', label: '✨ Otro' },
]

const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label || '✨ Otro'

const formatDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', {
  weekday: 'short', day: 'numeric', month: 'short',
})

export default function Panoramas() {
  const { person } = usePerson()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].value)
  const [planDate, setPlanDate] = useState('')
  const [place, setPlace] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('pendiente')
  const [filter, setFilter] = useState('todas')
  const [suggestion, setSuggestion] = useState(null)
  const [openId, setOpenId] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('panoramas')
      .select('*, panorama_stops(done)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setPlans(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!person) { setError('Elige quién eres arriba.'); return }
    if (!title.trim()) { setError('Escribe el panorama.'); return }

    setSaving(true)
    const { error } = await supabase.from('panoramas').insert({
      title: title.trim(),
      category,
      plan_date: planDate || null,
      place: place.trim() || null,
      notes: notes.trim() || null,
      person,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setTitle('')
    setPlanDate('')
    setPlace('')
    setNotes('')
    load()
  }

  const toggleDone = async (plan) => {
    const done = plan.status !== 'hecho'
    const { error } = await supabase
      .from('panoramas')
      .update({ status: done ? 'hecho' : 'pendiente', done_at: done ? new Date().toISOString() : null })
      .eq('id', plan.id)
    if (error) { setError(error.message); return }
    load()
  }

  const remove = async (plan) => {
    if (!window.confirm(`¿Eliminar "${plan.title}"?`)) return
    const { error } = await supabase.from('panoramas').delete().eq('id', plan.id)
    if (error) { setError(error.message); return }
    load()
  }

  const pending = plans.filter((p) => p.status !== 'hecho')
  const done = plans.filter((p) => p.status === 'hecho')

  const suggest = () => {
    const pool = pending.filter((p) => filter === 'todas' || p.category === filter)
    if (pool.length === 0) { setSuggestion(null); return }
    setSuggestion(pool[Math.floor(Math.random() * pool.length)])
  }

  const today = toDateKey(new Date())
  const upcoming = pending
    .filter((p) => p.plan_date && p.plan_date >= today)
    .sort((a, b) => a.plan_date.localeCompare(b.plan_date))[0]

  const visible = (view === 'hecho' ? done : pending)
    .filter((p) => filter === 'todas' || p.category === filter)

  const openPlan = plans.find((p) => p.id === openId)
  if (openPlan) {
    return <PanoramaRoute panorama={openPlan} onBack={() => { setOpenId(null); load() }} onChanged={load} />
  }

  const routeProgress = (p) => {
    const stops = p.panorama_stops || []
    if (stops.length === 0) return null
    return Math.round((stops.filter((s) => s.done).length / stops.length) * 100)
  }

  return (
    <div className="page">
      <h2>🎉 Panoramas</h2>

      <div className="page-grid">
        <div className="col-form">
          <div className="balance-card">
            <span className="balance-label">Próximo panorama</span>
            {upcoming ? (
              <>
                <span className="panorama-next-title">{upcoming.title}</span>
                <span className="balance-label">
                  {formatDate(upcoming.plan_date)}{upcoming.place ? ` · ${upcoming.place}` : ''}
                </span>
              </>
            ) : (
              <span className="panorama-next-title">Nada agendado aún</span>
            )}
            <div className="balance-breakdown">
              <div className="balance-row">
                <span>Por hacer: <strong>{pending.length}</strong></span>
                <span>Hechos: <strong>{done.length}</strong></span>
              </div>
            </div>
          </div>

          <div className="card">
            <strong>¿No saben qué hacer?</strong>
            <button type="button" className="primary" onClick={suggest} disabled={pending.length === 0}>
              🎲 Sugerir un panorama
            </button>
            {suggestion && (
              <div className="panorama-suggestion">
                <strong>{suggestion.title}</strong>
                <div className="meta">
                  {categoryLabel(suggestion.category)}{suggestion.place ? ` · ${suggestion.place}` : ''}
                </div>
              </div>
            )}
          </div>

          <form className="card" onSubmit={handleSubmit}>
            <label>
              Panorama
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Picnic en el cerro San Cristóbal" required />
            </label>

            <label>
              Categoría
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>

            <label>
              Fecha (opcional)
              <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
            </label>

            <label>
              Lugar (opcional)
              <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Providencia" />
            </label>

            <label>
              Notas (opcional)
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Llevar mantita y vino" />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Agregar panorama'}</button>
          </form>
        </div>

        <div className="col-list">
          <div className="toggle-group">
            <button type="button" className={view === 'pendiente' ? 'active' : ''} onClick={() => setView('pendiente')}>
              Por hacer ({pending.length})
            </button>
            <button type="button" className={view === 'hecho' ? 'active' : ''} onClick={() => setView('hecho')}>
              Hechos ({done.length})
            </button>
          </div>

          <div className="chips panorama-filters">
            <button type="button" className={`chip ${filter === 'todas' ? 'chip-on' : ''}`} onClick={() => setFilter('todas')}>Todas</button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`chip ${filter === c.value ? 'chip-on' : ''}`}
                onClick={() => setFilter(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {loading ? <p>Cargando…</p> : (
            <ul className="list">
              {visible.map((p) => (
                <li key={p.id} className={`list-item ${p.status === 'hecho' ? 'panorama-done' : ''}`}>
                  <div className="panorama-item-body" onClick={() => setOpenId(p.id)}>
                    <strong>{p.title}</strong>
                    <div className="meta">
                      {categoryLabel(p.category)}
                      {p.plan_date ? ` · ${formatDate(p.plan_date)}` : ''}
                      {p.place ? ` · ${p.place}` : ''}
                      {` · propuesto por ${p.person}`}
                    </div>
                    {routeProgress(p) != null && (
                      <div className="panorama-mini-progress">
                        <div className="route-progress"><div className="route-progress-fill" style={{ width: `${routeProgress(p)}%` }} /></div>
                        <span className="meta">🗺️ Ruta {routeProgress(p)}% · toca para abrir</span>
                      </div>
                    )}
                  </div>
                  <div className="panorama-actions">
                    <button
                      type="button"
                      className="panorama-action"
                      title={p.status === 'hecho' ? 'Marcar como pendiente' : 'Marcar como hecho'}
                      onClick={() => toggleDone(p)}
                    >
                      {p.status === 'hecho' ? '↩️' : '✅'}
                    </button>
                    <button type="button" className="panorama-action" title="Eliminar" onClick={() => remove(p)}>🗑️</button>
                  </div>
                </li>
              ))}
              {visible.length === 0 && (
                <p className="empty">
                  {view === 'hecho' ? 'Todavía no han marcado panoramas como hechos.' : 'No hay panoramas pendientes. ¡Agreguen uno!'}
                </p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

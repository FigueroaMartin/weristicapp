import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { usePerson } from '../PersonContext'
import ComingSoon from './ComingSoon'

const CATEGORIES = ['Comida', 'Bebidas', 'Entretenimiento', 'Transporte', 'Otro']

export default function Finanzas() {
  return <ComingSoon icon="💰" title="Finanzas" />
}

function FinanzasContent() {
  const { person } = usePerson()
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('gasto')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('finance_movements')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setMovements(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const balance = movements.reduce((acc, m) => acc + (m.type === 'aporte' ? Number(m.amount) : -Number(m.amount)), 0)

  const contributionsByPerson = movements
    .filter((m) => m.type === 'aporte')
    .reduce((acc, m) => {
      acc[m.person] = (acc[m.person] || 0) + Number(m.amount)
      return acc
    }, {})

  const spentByPerson = movements
    .filter((m) => m.type === 'gasto')
    .reduce((acc, m) => {
      acc[m.person] = (acc[m.person] || 0) + Number(m.amount)
      return acc
    }, {})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!person) { setError('Elige quién eres arriba.'); return }
    if (!amount || Number(amount) <= 0) { setError('Ingresa un monto válido.'); return }

    setSaving(true)
    const { error } = await supabase.from('finance_movements').insert({
      type,
      amount: Number(amount),
      description: description.trim(),
      category: type === 'gasto' ? category : null,
      person,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setAmount('')
    setDescription('')
    load()
  }

  const clp = (n) => n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

  return (
    <div className="page">
      <h2>💰 Finanzas</h2>

      <div className="page-grid">
        <div className="col-form">
          <div className="balance-card">
            <span className="balance-label">Saldo cuenta conjunta</span>
            <span className={`balance-amount ${balance < 0 ? 'negative' : ''}`}>{clp(balance)}</span>
            <div className="balance-breakdown">
              {Object.keys({ ...contributionsByPerson, ...spentByPerson }).map((p) => (
                <div key={p} className="balance-row">
                  <strong>{p}</strong>
                  <span>Aportó {clp(contributionsByPerson[p] || 0)} · Gastó {clp(spentByPerson[p] || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          <form className="card" onSubmit={handleSubmit}>
            <div className="toggle-group">
              <button type="button" className={type === 'aporte' ? 'active' : ''} onClick={() => setType('aporte')}>Aporte a la cuenta</button>
              <button type="button" className={type === 'gasto' ? 'active' : ''} onClick={() => setType('gasto')}>Gasto de una salida</button>
            </div>

            <label>
              Monto (CLP)
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="15000" required />
            </label>

            {type === 'gasto' && (
              <label>
                Categoría
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            )}

            <label>
              Descripción
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === 'aporte' ? 'Transferencia mensual' : 'Cena viernes'} />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Guardando…' : type === 'aporte' ? 'Registrar aporte' : 'Registrar gasto'}
            </button>
          </form>
        </div>

        <div className="col-list">
          <h3>Movimientos</h3>
          {loading ? <p>Cargando…</p> : (
            <ul className="list">
              {movements.map((m) => (
                <li key={m.id} className="list-item">
                  <div>
                    <strong>{m.type === 'aporte' ? '➕' : '➖'} {m.description || (m.type === 'aporte' ? 'Aporte' : 'Gasto')}</strong>
                    <div className="meta">{m.person} · {m.category ? `${m.category} · ` : ''}{new Date(m.created_at).toLocaleString('es-CL')}</div>
                  </div>
                  <span className={m.type === 'aporte' ? 'amount positive' : 'amount negative'}>
                    {m.type === 'aporte' ? '+' : '-'}{clp(Number(m.amount))}
                  </span>
                </li>
              ))}
              {!loading && movements.length === 0 && <p className="empty">Aún no hay movimientos.</p>}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

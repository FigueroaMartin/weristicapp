import { useState } from 'react'

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD
const STORAGE_KEY = 'nosotros_unlocked'

export default function AppLock({ children }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  if (!APP_PASSWORD || unlocked) return children

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === APP_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setUnlocked(true)
    } else {
      setError('Clave incorrecta')
      setInput('')
    }
  }

  return (
    <div className="lock-screen">
      <form className="lock-card" onSubmit={handleSubmit}>
        <h1 className="lock-title">Weristicapp</h1>
        <p className="lock-subtitle">Ingresa la clave para continuar</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={input}
          onChange={(e) => { setInput(e.target.value); setError('') }}
          placeholder="Clave"
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary">Entrar</button>
      </form>
    </div>
  )
}

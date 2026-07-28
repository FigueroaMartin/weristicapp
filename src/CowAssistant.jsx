import { useEffect, useState } from 'react'
import { tts } from './tts'

const GREETING = '¡Hola! Mi nombre es Ilía, bienvenido a Weristicapp 🐮'

export default function CowAssistant() {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!open) return
    setTyped('')
    let i = 0
    const typeTimer = setInterval(() => {
      i += 1
      setTyped(GREETING.slice(0, i))
      if (i >= GREETING.length) clearInterval(typeTimer)
    }, 40)

    tts.speak(GREETING)

    return () => {
      clearInterval(typeTimer)
      tts.stop()
    }
  }, [open])

  return (
    <div className="cow-assistant">
      {open && (
        <div className="cow-bubble">
          <p>{typed}<span className="welcome-caret">|</span></p>
          {tts.isSupported && (
            <button type="button" className="cow-mute-btn" onClick={() => tts.stopCurrent()} aria-label="Silenciar">
              🔇
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        className="cow-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Asistente Ilía"
      >
        <img
          src={`${import.meta.env.BASE_URL}cow-quiet.png`}
          alt=""
          className="cow-fab-img"
        />
      </button>
    </div>
  )
}

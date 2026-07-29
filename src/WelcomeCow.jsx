import { useEffect, useState } from 'react'
import { tts } from './tts'

const MESSAGE = '¡Hola! Mi nombre es Lya, bienvenido a Weristicapp 🐮'

export default function WelcomeCow({ onDone }) {
  const [talking, setTalking] = useState(true)
  const [typed, setTyped] = useState('')
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const mouthTimer = setInterval(() => setTalking((t) => !t), 350)
    return () => clearInterval(mouthTimer)
  }, [])

  useEffect(() => {
    let i = 0
    const typeTimer = setInterval(() => {
      i += 1
      setTyped(MESSAGE.slice(0, i))
      if (i >= MESSAGE.length) clearInterval(typeTimer)
    }, 45)

    // Most mobile browsers block speech synthesis until the page has
    // received a real user gesture — speaking immediately on mount (no
    // prior tap) gets silently dropped. Try right away for browsers that
    // allow it, and also arm a one-time listener for the first tap/click
    // anywhere as a fallback so the greeting is never missed on mobile.
    tts.speak(MESSAGE)
    let spoken = false
    const speakOnce = () => {
      if (spoken) return
      spoken = true
      tts.speak(MESSAGE)
    }
    window.addEventListener('pointerdown', speakOnce, { once: true })
    window.addEventListener('keydown', speakOnce, { once: true })

    return () => {
      clearInterval(typeTimer)
      tts.stop()
      window.removeEventListener('pointerdown', speakOnce)
      window.removeEventListener('keydown', speakOnce)
    }
  }, [])

  const handleContinue = () => {
    tts.stop()
    setLeaving(true)
    setTimeout(() => onDone?.(), 350)
  }

  return (
    <div className={`welcome-screen ${leaving ? 'leaving' : ''}`}>
      <div className="welcome-cow-wrap">
        <img
          src={`${import.meta.env.BASE_URL}cow-talking.png`}
          alt="Vaca dando la bienvenida"
          className="welcome-cow"
          style={{ opacity: talking ? 1 : 0 }}
        />
        <img
          src={`${import.meta.env.BASE_URL}cow-quiet.png`}
          alt=""
          className="welcome-cow"
          style={{ opacity: talking ? 0 : 1 }}
        />
      </div>
      <p className="welcome-text">{typed}<span className="welcome-caret">|</span></p>
      <button type="button" className="primary welcome-btn" onClick={handleContinue}>
        Entrar
      </button>
    </div>
  )
}

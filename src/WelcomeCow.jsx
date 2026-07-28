import { useEffect, useState } from 'react'
import { tts } from './tts'

const MESSAGE = '¡Hola! Mi nombre es Ilía, bienvenido a Weristicapp 🐮'

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

    tts.speak(MESSAGE)

    return () => {
      clearInterval(typeTimer)
      tts.stop()
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

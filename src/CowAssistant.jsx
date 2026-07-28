import { useEffect, useRef, useState } from 'react'
import { tts } from './tts'
import { TUTORIAL_STEPS } from './tutorialContent'

const TUTORIAL_DONE_KEY = 'weristicapp_tutorial_done'
const FAQ_INTRO = '¿Tienes alguna duda? Elige un tema:'

function useTypewriter(text, active) {
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (!active) { setTyped(''); return }
    setTyped('')
    let i = 0
    const timer = setInterval(() => {
      i += 1
      setTyped(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, 35)
    return () => clearInterval(timer)
  }, [text, active])
  return typed
}

export default function CowAssistant() {
  const tutorialDone = useRef(localStorage.getItem(TUTORIAL_DONE_KEY) === 'true')
  const [open, setOpen] = useState(!tutorialDone.current)
  const [mode, setMode] = useState(tutorialDone.current ? 'faq' : 'tutorial')
  const [stepIndex, setStepIndex] = useState(0)
  const [sectionId, setSectionId] = useState(null)

  const currentText =
    mode === 'tutorial' ? TUTORIAL_STEPS[stepIndex].text
    : mode === 'section' ? (TUTORIAL_STEPS.find((s) => s.id === sectionId)?.text || '')
    : FAQ_INTRO

  const typed = useTypewriter(currentText, open)

  useEffect(() => {
    if (!open) return
    tts.speak(currentText)
    return () => tts.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentText])

  const finishTutorial = () => {
    localStorage.setItem(TUTORIAL_DONE_KEY, 'true')
    tutorialDone.current = true
    tts.stop()
    setOpen(false)
  }

  const nextStep = () => {
    if (stepIndex >= TUTORIAL_STEPS.length - 1) finishTutorial()
    else setStepIndex((i) => i + 1)
  }

  const openBubble = () => {
    if (open) { tts.stop(); setOpen(false); return }
    if (tutorialDone.current) {
      setMode('faq')
    } else {
      setMode('tutorial')
      setStepIndex(0)
    }
    setOpen(true)
  }

  const pickSection = (id) => {
    setSectionId(id)
    setMode('section')
  }

  const backToFaq = () => {
    tts.stop()
    setMode('faq')
  }

  return (
    <div className="cow-assistant">
      {open && (
        <div className="cow-bubble cow-bubble-wide">
          <div className="cow-bubble-body">
            {mode === 'tutorial' && (
              <>
                <strong className="cow-bubble-title">{TUTORIAL_STEPS[stepIndex].title}</strong>
                <p>{typed}<span className="welcome-caret">|</span></p>
                <div className="cow-bubble-actions">
                  <button type="button" className="toggle-group-btn cow-bubble-btn" onClick={finishTutorial}>Saltar</button>
                  <button type="button" className="primary cow-bubble-btn" onClick={nextStep}>
                    {stepIndex >= TUTORIAL_STEPS.length - 1 ? 'Listo' : 'Siguiente'}
                  </button>
                </div>
                <span className="cow-step-indicator">{stepIndex + 1} / {TUTORIAL_STEPS.length}</span>
              </>
            )}

            {mode === 'faq' && (
              <>
                <p>{typed}<span className="welcome-caret">|</span></p>
                <div className="cow-faq-list">
                  {TUTORIAL_STEPS.map((s) => (
                    <button key={s.id} type="button" className="cow-faq-item" onClick={() => pickSection(s.id)}>
                      {s.title}
                    </button>
                  ))}
                </div>
              </>
            )}

            {mode === 'section' && (
              <>
                <strong className="cow-bubble-title">{TUTORIAL_STEPS.find((s) => s.id === sectionId)?.title}</strong>
                <p>{typed}<span className="welcome-caret">|</span></p>
                <button type="button" className="link-btn" onClick={backToFaq}>‹ Volver</button>
              </>
            )}
          </div>

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
        onClick={openBubble}
        aria-label="Asistente Lya"
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

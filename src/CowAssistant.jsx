import { useEffect, useRef, useState } from 'react'
import { tts } from './tts'
import { TUTORIAL_STEPS } from './tutorialContent'
import { sendTutorialAction } from './tutorialBus'

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

  // The step object currently being shown, whether from the guided tour
  // or from picking a topic in the "¿Tienes alguna duda?" menu.
  const activeStep =
    mode === 'tutorial' ? TUTORIAL_STEPS[stepIndex]
    : mode === 'section' ? TUTORIAL_STEPS.find((s) => s.id === sectionId)
    : null

  const currentText = activeStep ? activeStep.text : FAQ_INTRO
  const typed = useTypewriter(currentText, open)

  useEffect(() => {
    if (!open) return
    tts.speak(currentText)
    return () => tts.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentText, mode])

  // Drives the app: switches tabs / opens panels for the active step, and
  // highlights the matching element on screen. Cleans up the highlight
  // whenever the step changes or the assistant closes.
  useEffect(() => {
    if (!open || !activeStep) return

    if (activeStep.action) sendTutorialAction(activeStep.action)

    let highlighted = null
    const timer = setTimeout(() => {
      if (!activeStep.target) return
      highlighted = document.querySelector(`[data-tutorial-id="${activeStep.target}"]`)
      if (highlighted) {
        highlighted.classList.add('tutorial-highlight')
        highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      if (highlighted) highlighted.classList.remove('tutorial-highlight')
    }
  }, [open, activeStep])

  const finishTutorial = () => {
    localStorage.setItem(TUTORIAL_DONE_KEY, 'true')
    tutorialDone.current = true
    tts.stop()
    sendTutorialAction({ type: 'restore' })
    setOpen(false)
  }

  const nextStep = () => {
    if (stepIndex >= TUTORIAL_STEPS.length - 1) finishTutorial()
    else setStepIndex((i) => i + 1)
  }

  const openBubble = () => {
    if (open) {
      tts.stop()
      sendTutorialAction({ type: 'restore' })
      setOpen(false)
      return
    }
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
    sendTutorialAction({ type: 'restore' })
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
                <strong className="cow-bubble-title">{activeStep?.title}</strong>
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

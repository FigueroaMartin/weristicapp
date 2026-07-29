// Minimal event bus so the tutorial (owned by CowAssistant) can drive UI
// state that lives in other components (active tab, panels open) without
// a heavy shared context. Components opt in by listening for the event.

const EVENT_NAME = 'tutorial:action'

/** @param {{type: string, value?: string}} action */
export function sendTutorialAction(action) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: action }))
}

/** @param {(action: {type: string, value?: string}) => void} handler */
export function onTutorialAction(handler) {
  const listener = (event) => handler(event.detail)
  window.addEventListener(EVENT_NAME, listener)
  return () => window.removeEventListener(EVENT_NAME, listener)
}

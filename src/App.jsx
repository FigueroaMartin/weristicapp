import { useEffect, useState } from 'react'
import { PersonProvider, usePerson } from './PersonContext'
import WelcomeCow from './WelcomeCow'
import CowAssistant from './CowAssistant'
import { onTutorialAction } from './tutorialBus'
import Finanzas from './pages/Finanzas'
import Alimentacion from './pages/Alimentacion'
import Deporte from './pages/Deporte'
import Galeria from './pages/Galeria'

const TABS = [
  { key: 'deporte', label: 'Deporte', icon: '🏃', Component: Deporte },
  { key: 'finanzas', label: 'Finanzas', icon: '💰', Component: Finanzas },
  { key: 'alimentacion', label: 'Alimentación', icon: '🥗', Component: Alimentacion },
  { key: 'galeria', label: 'Galería', icon: '🖼️', Component: Galeria },
]

function PersonSwitcher() {
  const { person, setPerson } = usePerson()
  return (
    <div className="person-switcher">
      <button
        type="button"
        className={person === 'Martín' ? 'active' : ''}
        onClick={() => setPerson('Martín')}
      >
        Martín
      </button>
      <button
        type="button"
        className={person === 'Micaella' ? 'active' : ''}
        onClick={() => setPerson('Micaella')}
      >
        Micaella
      </button>
    </div>
  )
}

function AppShell() {
  const { person } = usePerson()
  const [activeTab, setActiveTab] = useState('deporte')
  const [menuOpen, setMenuOpen] = useState(false)
  const ActiveComponent = TABS.find((t) => t.key === activeTab).Component

  const pickTab = (key) => {
    setActiveTab(key)
    setMenuOpen(false)
  }

  useEffect(() => onTutorialAction((action) => {
    if (action.type === 'tab') setActiveTab(action.value)
    if (action.type === 'restore') setActiveTab('deporte')
  }), [])

  return (
    <div className={`app ${menuOpen ? 'nav-open' : 'nav-closed'}`} data-person={person || 'none'}>
      <header className="app-header">
        <button type="button" className="app-title-btn" onClick={() => setMenuOpen((v) => !v)}>
          Weristicapp
        </button>
        <PersonSwitcher />
      </header>

      {menuOpen && (
        <nav className="tabbar top-tabbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => pickTab(tab.key)}
            >
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>
      )}

      <main className="app-main">
        <ActiveComponent />
      </main>
    </div>
  )
}

function App() {
  const [welcomed, setWelcomed] = useState(false)

  return (
    <PersonProvider>
      {welcomed ? (
        <>
          <AppShell />
          <CowAssistant />
        </>
      ) : (
        <WelcomeCow onDone={() => setWelcomed(true)} />
      )}
    </PersonProvider>
  )
}

export default App

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppLock from './AppLock.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppLock>
      <App />
    </AppLock>
  </StrictMode>,
)

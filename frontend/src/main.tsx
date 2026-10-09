import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { preloadKeySounds } from './components/general/keySound'
import { preloadGameSounds } from './components/general/gameSound'

preloadKeySounds()
preloadGameSounds()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

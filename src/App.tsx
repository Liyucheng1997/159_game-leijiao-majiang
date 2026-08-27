import { useEffect } from 'react'
import { soundManager } from './audio/soundManager'
import { Board } from './board/Board'
import { ActionBar } from './ui/hud/ActionBar'
import { Scoreboard } from './ui/hud/Scoreboard'
import { HandResultModal } from './ui/modals/HandResultModal'
import { SettingsModal } from './ui/modals/SettingsModal'
import { PortraitOverlay } from './ui/portraits/PortraitOverlay'
import './App.css'

function App() {
  useEffect(() => {
    soundManager.init()
  }, [])
  return (
    <div id="app-root">
      <Board />
      <PortraitOverlay />
      <Scoreboard />
      <SettingsModal />
      <ActionBar />
      <HandResultModal />
    </div>
  )
}

export default App

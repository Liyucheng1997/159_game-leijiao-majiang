import { TableScene } from './three/scene/TableScene'
import { ActionBar } from './ui/hud/ActionBar'
import { Scoreboard } from './ui/hud/Scoreboard'
import { HandResultModal } from './ui/modals/HandResultModal'
import { SettingsModal } from './ui/modals/SettingsModal'
import { PortraitOverlay } from './ui/portraits/PortraitOverlay'
import './App.css'

function App() {
  return (
    <div id="app-root">
      <TableScene />
      <PortraitOverlay />
      <Scoreboard />
      <SettingsModal />
      <ActionBar />
      <HandResultModal />
    </div>
  )
}

export default App

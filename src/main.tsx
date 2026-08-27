import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TileGallery } from './board/TileGallery.tsx'
import { applyTheme, loadTheme } from './ui/theme.ts'

applyTheme(loadTheme())

const showGallery = new URLSearchParams(window.location.search).has('gallery')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{showGallery ? <TileGallery /> : <App />}</StrictMode>,
)

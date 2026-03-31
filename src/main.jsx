import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from "@vercel/analytics/react"
import './index.css'
import App from './App.jsx'
import { UserProvider } from './contexts/UserContext'
import { FileSystemProvider } from './contexts/FileSystemContext'
import MobileBlocker from './components/MobileBlocker'

// Register service worker for caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.log('Service Worker registration failed:', err)
  })
}

createRoot(document.getElementById('root')).render(
  <UserProvider>
    <FileSystemProvider>
      <MobileDetectWrapper>
        <App />
        <Analytics />
      </MobileDetectWrapper>
    </FileSystemProvider>
  </UserProvider>,
)

// Wrapper to block mobile devices
function MobileDetectWrapper({ children }) {
  const [isSmallScreen, setIsSmallScreen] = useState(() => window.innerWidth <= 750)
  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth <= 750)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  if (isSmallScreen) {
    return <MobileBlocker />
  }
  return children
}

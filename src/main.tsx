import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element #root was not found in index.html')
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      // eslint-disable-next-line no-console
      console.log('Service worker registered:', registration.scope)
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Service worker registration failed:', error)
    })
}

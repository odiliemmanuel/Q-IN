import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element #root was not found in index.html')
}

try {
  createRoot(container).render(
    <React.StrictMode>
      <ErrorBoundary fallback={<div style={{ padding: '20px', fontFamily: 'system-ui', color: 'red' }}><h1>App crashed</h1><p>Please check console for details.</p></div>}>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Failed to mount React app:', error)
  container.innerHTML = `
    <div style="padding: 20px; font-family: system-ui; color: red;">
      <h1>Failed to mount app</h1>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
      <pre>${error instanceof Error ? error.stack : ''}</pre>
    </div>
  `
}

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('Service worker registered:', registration.scope)
    })
    .catch((error) => {
      console.error('Service worker registration failed:', error)
    })
}

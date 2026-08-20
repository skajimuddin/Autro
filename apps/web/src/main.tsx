import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import CssBaseline from '@mui/material/CssBaseline'
import '@/index.css'
import App from '@/App'
import { theme } from '@/theme'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('ServiceWorker registration failed:', error);
    });
  });
}

createRoot(rootElement).render(
  <StrictMode>
    {/* Stamps data-mui-color-scheme on <html> before first paint, so the app
        does not flash light before switching to the user's dark preference —
        index.css keys the Tailwind tokens off the same attribute. */}
    <InitColorSchemeScript attribute="data-mui-color-scheme" />
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)

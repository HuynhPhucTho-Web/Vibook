import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'react-toastify'
import './utils/confirmDialog'
import './style/design-system.css'
import './index.css'
import App from './App.jsx'
import './style/App.css'

// Global polyfill: prevent native browser "localhost says" alerts
if (typeof window !== 'undefined') {
  window.alert = (msg) => {
    toast.info(msg);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

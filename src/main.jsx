import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.storage = {
  get: async (key) => ({ value: localStorage.getItem(key) }),
  set: async (key, val) => { localStorage.setItem(key, val); return true; },
  delete: async (key) => { localStorage.removeItem(key); return true; }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

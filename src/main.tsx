import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { Buffer } from 'buffer';

// Polyfill Buffer for isomorphic-git
window.Buffer = window.Buffer || Buffer;

// Initialize the Progressive Web App Service Worker
// This allows caching of the Pyodide/PHP/Ruby binaries and offline capability
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('A new version of Kiri Code is available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('[PWA] Kiri Code is ready to work offline.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

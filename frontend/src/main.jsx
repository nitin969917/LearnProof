import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Handle dynamic import asset chunk failures (post-deployment / Cloudflare cache mismatch)
const handleAssetChunkError = (errorMsg) => {
  const msg = String(errorMsg || '');
  if (
    msg.includes('Failed to fetch dynamically imported module') || 
    msg.includes('Importing a module script failed') || 
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Failed to load module script') ||
    msg.includes('Strict MIME type checking') ||
    msg.includes('text/html') ||
    msg.includes("reading 'default'") ||
    msg.includes("properties of undefined") ||
    msg.includes("Unexpected token '<'") ||
    msg.includes("Stale chunk") ||
    msg.includes("stale chunk")
  ) {
    console.warn('Post-deployment chunk mismatch detected. Auto-refreshing page for fresh assets...', msg);
    const lastReload = sessionStorage.getItem('chunk_reload_timestamp');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 3000) {
      sessionStorage.setItem('chunk_reload_timestamp', String(now));
      window.location.reload();
    }
    return true;
  }
  return false;
};

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  handleAssetChunkError('vite:preloadError');
});

window.addEventListener('error', (event) => {
  const errMsg = event.message || event.error?.message || '';
  if (handleAssetChunkError(errMsg)) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const errMsg = event.reason?.message || String(event.reason || '');
  if (handleAssetChunkError(errMsg)) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={clientId}>
    <AuthProvider>
      <App />
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            fontSize: '0.875rem',
          }
        }}
      />
    </AuthProvider>
  </GoogleOAuthProvider>
)

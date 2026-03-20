import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

window.addEventListener('error', (event) => {
  console.error("Global Frontend Error:", event.error);
  // Avoid multiple overlays
  if (document.getElementById('fatal-error-overlay')) return;

  const errorDiv = document.createElement('div');
  errorDiv.id = 'fatal-error-overlay';
  errorDiv.style.cssText = "position: fixed; inset: 0; padding: 2rem; background: rgba(254, 226, 226, 0.98); color: #991b1b; z-index: 999999; font-family: monospace; overflow: auto; backdrop-filter: blur(4px);";
  errorDiv.innerHTML = `
    <div style="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-red-200">
      <h1 style="font-size: 1.875rem; font-weight: bold; margin-bottom: 1rem; color: #dc2626;">Fatal Frontend Crash</h1>
      <p style="margin-bottom: 1.5rem; color: #4b5563; font-size: 1rem;">The application encountered an unexpected error. We've captured the technical details below.</p>
      <div style="background: #f8fafc; padding: 1.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; margin-bottom: 2rem;">
        <pre style="white-space: pre-wrap; font-size: 0.8125rem; color: #1e293b; max-height: 400px; overflow: auto;">${event.error?.stack || event.message}</pre>
      </div>
      <div style="display: flex; gap: 1rem;">
        <button onclick="window.location.reload()" style="padding: 0.75rem 1.5rem; background: #dc2626; color: white; border: none; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: background 0.2s;">Refresh Page</button>
        <button onclick="document.getElementById('fatal-error-overlay').remove()" style="padding: 0.75rem 1.5rem; background: #64748b; color: white; border: none; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: background 0.2s;">Dismiss</button>
      </div>
    </div>
  `;
  document.body.appendChild(errorDiv);
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

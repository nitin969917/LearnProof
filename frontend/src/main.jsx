import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { motion } from 'framer-motion';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// User-controlled Desktop / Mac Zoom Support (Default: 100% natural, shortcuts: Cmd/Ctrl + / - / 0)
(function initDesktopZoom() {
  if (typeof window === 'undefined') return;

  const saved = localStorage.getItem('user_desktop_zoom');
  if (saved && saved !== '1' && saved !== '1.0') {
    document.documentElement.style.zoom = saved;
  }

  let toastTimer = null;
  const showZoomIndicator = (zoomVal) => {
    let el = document.getElementById('zoom-level-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'zoom-level-indicator';
      el.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999999] bg-gray-900/90 dark:bg-gray-800/95 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md pointer-events-none transition-opacity duration-200';
      document.body.appendChild(el);
    }
    el.innerText = `Zoom: ${Math.round(zoomVal * 100)}%`;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (el) el.style.opacity = '0';
    }, 1200);
  };

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+' || e.key === '-')) {
      e.preventDefault();
      const current = parseFloat(document.documentElement.style.zoom || localStorage.getItem('user_desktop_zoom') || '1.0') || 1.0;
      let next = current;
      if (e.key === '=' || e.key === '+') {
        next = Math.min(1.4, +(current + 0.05).toFixed(2));
      } else if (e.key === '-') {
        next = Math.max(0.75, +(current - 0.05).toFixed(2));
      }
      document.documentElement.style.zoom = String(next);
      localStorage.setItem('user_desktop_zoom', String(next));
      showZoomIndicator(next);
    } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
      e.preventDefault();
      document.documentElement.style.zoom = '1.0';
      localStorage.removeItem('user_desktop_zoom');
      showZoomIndicator(1.0);
    }
  });
})();



// Reusable swipe-up gesture wrapper for standard toasts (success, error, info)
const SwipeableToast = ({ toast: t, children }) => {
  return (
    <motion.div
      drag={t.type !== 'loading' ? 'y' : false}
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.85, bottom: 0.05 }}
      initial={false}
      onDragEnd={(_, info) => {
        if (info.offset.y < -20 || info.velocity.y < -150) {
          toast.dismiss(t.id);
        }
      }}
      whileDrag={{ scale: 0.98, opacity: 0.92 }}
      animate={t.visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -45, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className={`relative touch-none select-none ${t.type !== 'loading' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ pointerEvents: 'auto' }}
    >
      {t.type !== 'loading' && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gray-300/80 dark:bg-gray-500/80 rounded-full z-10 pointer-events-none" />
      )}
      {children}
    </motion.div>
  );
};

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
    msg.includes('is not a valid JavaScript MIME type')
  ) {
    const lastReload = parseInt(sessionStorage.getItem('chunk_reload_timestamp') || '0', 10);
    const now = Date.now();
    if (now - lastReload > 10000) {
      sessionStorage.setItem('chunk_reload_timestamp', now.toString());
      window.location.reload();
      return true;
    }
  }
  return false;
};

window.addEventListener('error', (event) => {
  const errMsg = event.message || event.error?.message || String(event || '');
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
        position='top-center'
        reverseOrder={false}
        gutter={10}
        containerStyle={{
          zIndex: 99999999,
          top: 24
        }}
        toastOptions={{
          duration: 3500,
          style: {
            zIndex: 99999999,
            fontSize: '0.85rem',
            fontWeight: '700',
            borderRadius: '0.85rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 14px',
          }
        }}
      >
        {(t) => (
          <SwipeableToast toast={t}>
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  {icon}
                  {message}
                  {t.type !== 'loading' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                      }}
                      className="ml-2 -mr-1 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                      title="Close"
                      aria-label="Close notification"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          </SwipeableToast>
        )}
      </Toaster>
    </AuthProvider>
  </GoogleOAuthProvider>
)

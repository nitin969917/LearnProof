import axios from 'axios';

// Use the same backend URL as the rest of the app (VITE_BACKEND_URL env var)
// Previously used window.location.host which pointed to Cloudflare Pages (static host)
// and caused 405 Method Not Allowed for POST requests
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const baseURL = `${backendUrl}/api`;

const socialApi = axios.create({
  baseURL,
});

socialApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('google_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

socialApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('google_token');
      if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/classroom'))) {
        sessionStorage.setItem('redirect_to', window.location.pathname + window.location.search);
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default socialApi;

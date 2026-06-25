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

export default socialApi;

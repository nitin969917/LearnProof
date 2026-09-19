import axios from 'axios';

let backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
if (typeof window !== 'undefined' && window.location.hostname.includes('learnproofai.com')) {
  backendUrl = window.location.origin;
} else if (backendUrl.includes('learnproofai.com') && !backendUrl.includes('api.learnproofai.com')) {
  backendUrl = 'https://api.learnproofai.com';
}
const baseURL = `${backendUrl}/api`;

const socialApi = axios.create({
  baseURL,
  timeout: 15000,
});

socialApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('google_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;

    // Directly embed idToken into the request URL query string so native iOS bridges cannot strip it
    if (config.url && !config.url.includes('idToken=')) {
      const sep = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${sep}idToken=${encodeURIComponent(token)}`;
    }

    config.params = config.params || {};
    if (!config.params.idToken) {
      config.params.idToken = token;
    }
  }
  return config;
});

export default socialApi;

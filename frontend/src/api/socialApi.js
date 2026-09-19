import axios from 'axios';

let backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
if (typeof window !== 'undefined' && window.location.hostname.includes('learnproofai.com')) {
  backendUrl = 'https://api.learnproofai.com';
} else if (backendUrl.includes('learnproofai.com') && !backendUrl.includes('api.learnproofai.com')) {
  backendUrl = 'https://api.learnproofai.com';
}
const baseURL = `${backendUrl}/api`;

const socialApi = axios.create({
  baseURL,
});

socialApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('google_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Dual-transport: Also append token/idToken to params for all requests
    // Ensures authentication never fails in iOS WKWebView or Capacitor native HTTP
    // where Authorization header can be stripped by cross-origin policies
    config.params = config.params || {};
    if (!config.params.idToken) {
      config.params.idToken = token;
    }
    if (!config.params.token) {
      config.params.token = token;
    }
  }
  return config;
});

export default socialApi;

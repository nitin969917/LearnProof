import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseURL = isLocalhost 
  ? `http://${window.location.hostname}:8000/api` 
  : `${window.location.protocol}//${window.location.host}/api`;

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

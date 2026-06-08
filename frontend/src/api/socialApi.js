import axios from 'axios';

const socialApi = axios.create({
  baseURL: `http://${window.location.hostname}:8000/api`,
});

socialApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('google_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default socialApi;

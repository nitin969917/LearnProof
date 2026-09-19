import axios, { AxiosError } from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

let backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
if (typeof window !== 'undefined' && window.location.hostname.includes('learnproofai.com')) {
  backendUrl = 'https://api.learnproofai.com';
} else if (backendUrl.includes('learnproofai.com') && !backendUrl.includes('api.learnproofai.com')) {
  backendUrl = 'https://api.learnproofai.com';
}
const baseURL = `${backendUrl}/api`;

const capacitorAdapter = async (config) => {
  let fullUrl = config.url || '';
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    const base = (config.baseURL || baseURL).replace(/\/$/, '');
    const path = fullUrl.replace(/^\//, '');
    fullUrl = `${base}/${path}`;
  }

  // Convert headers if needed
  let headers = {};
  if (config.headers) {
    headers = typeof config.headers.toJSON === 'function' ? config.headers.toJSON() : { ...config.headers };
  }

  // Format query params if any
  let finalUrl = fullUrl;
  if (config.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(config.params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryStr = searchParams.toString();
    if (queryStr) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryStr;
    }
  }

  const options = {
    url: finalUrl,
    method: (config.method || 'GET').toUpperCase(),
    headers,
    data: config.data,
  };

  try {
    const res = await CapacitorHttp.request(options);
    const axiosResponse = {
      data: res.data,
      status: res.status,
      statusText: res.status === 200 ? 'OK' : String(res.status),
      headers: res.headers || {},
      config,
      request: {}
    };

    if (res.status >= 200 && res.status < 300) {
      return axiosResponse;
    }

    const message = `Request failed with status code ${res.status}`;
    const error = new AxiosError(message, AxiosError.ERR_BAD_RESPONSE, config, {}, axiosResponse);
    return Promise.reject(error);
  } catch (err) {
    if (err.isAxiosError) throw err;
    const error = new AxiosError(err.message || 'Network Error', AxiosError.ERR_NETWORK, config);
    return Promise.reject(error);
  }
};

const socialApi = axios.create({
  baseURL,
  adapter: Capacitor.isNativePlatform() ? capacitorAdapter : undefined,
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
  // Add query timestamp on GET to prevent iOS WKWebView aggressive caching without triggering CORS header preflight errors
  if (config.method && config.method.toLowerCase() === 'get') {
    config.params = config.params || {};
    config.params._t = Date.now();
  }
  return config;
});

export default socialApi;

import axios from 'axios';

export const getCompilerBackendUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000';
  }
  return import.meta.env.VITE_BACKEND_URL || 'https://api.learnproofai.com';
};

/**
 * Execute code on the server sandbox.
 */
export const executeCode = async ({ language, code, stdin = '' }) => {
  const backendUrl = getCompilerBackendUrl();
  const response = await axios.post(`${backendUrl}/api/compiler/run`, {
    language,
    code,
    stdin
  }, {
    timeout: 15000 // 15 second request timeout
  });

  return response.data?.data || response.data;
};

/**
 * Convert code snippet between programming languages using AI.
 */
export const convertCodeSnippet = async ({ code, fromLanguage, toLanguage }) => {
  const backendUrl = getCompilerBackendUrl();
  const response = await axios.post(`${backendUrl}/api/compiler/convert-code`, {
    code,
    fromLanguage,
    toLanguage
  }, {
    timeout: 20000 // 20 second AI request timeout
  });

  return response.data?.data || response.data;
};

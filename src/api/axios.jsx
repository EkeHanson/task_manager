import axios from 'axios';

// Use localhost for development, production URL for production
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9090/api/project-manager/api';


const instance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Create a separate instance for knowledge base that doesn't auto-redirect on 401
const knowledgeBaseInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

knowledgeBaseInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Knowledge base instance doesn't auto-redirect on 401, allowing unauthenticated access
knowledgeBaseInstance.interceptors.response.use(
  response => response,
  error => {
    // Only redirect on 401 if we're not in the knowledge base context
    if (error.response?.status === 401 && !error.config.url?.includes('/knowledge/')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
export { knowledgeBaseInstance };
import axios from 'axios';

export const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://ds42s-b.onrender.com').replace(/\/$/, '');
export const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, clear token if expired and not on login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('director');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

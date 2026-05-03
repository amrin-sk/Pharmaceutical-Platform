import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  // ❌ Do NOT send token for login/register
  if (
    token &&
    !config.url.includes('/users/login/') &&
    !config.url.includes('/users/register/')
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// auth APIs
export const registerUser = (data) => API.post('/users/register/', data);
export const loginUser = (data) => API.post('/users/login/', data);

export default API;
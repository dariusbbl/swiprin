import axios from 'axios';

const client = axios.create({
  baseURL: '/api',   // proxied to http://localhost:8080/api by Vite in dev
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = window.__swiprin_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.__swiprin_token = null;
      window.dispatchEvent(new Event('swiprin:logout'));
    }
    return Promise.reject(err);
  }
);

export default client;

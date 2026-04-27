import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from memory (set by AuthContext)
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

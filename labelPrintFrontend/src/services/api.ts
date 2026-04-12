import axios from 'axios';

const BASE_URL = 'http://192.168.0.233:5454/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

import NetInfo from '@react-native-community/netinfo';

api.interceptors.request.use(async config => {
  try {
    const state = await Promise.race([
      NetInfo.fetch(),
      new Promise(resolve => setTimeout(() => resolve(null), 500)),
    ]);
    const ip = (state as any)?.details?.ipAddress;
    if (ip) config.headers['x-local-ip'] = ip;
  } catch {}
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Error de conexión con el servidor';
    return Promise.reject(new Error(message));
  },
);

export default api;

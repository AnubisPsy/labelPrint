import axios from 'axios';

// Cambiá esta IP por la del servidor cuando el backend esté listo
//const BASE_URL = 'http://192.168.1.100:3000/api';
//const BASE_URL = 'http://192.168.0.233:9090/api';
//const BASE_URL = 'http://10.0.2.2:9090/api';
//const BASE_URL = 'http://0.0.0.0:9090/api';
//const BASE_URL = 'http://192.168.1.219:9090/api';
const BASE_URL = 'http://192.168.0.233:5454/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
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

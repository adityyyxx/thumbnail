import axios from 'axios';

// Fallback to production server if env var is missing or misconfigured
const BASE_URL = import.meta.env.VITE_BASE_URL?.startsWith('http')
    ? import.meta.env.VITE_BASE_URL
    : 'https://thumbnail-server-seven.vercel.app';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
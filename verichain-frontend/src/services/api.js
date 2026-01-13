import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('verichain_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('verichain_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (userId, orgName) => api.post('/login', { userId, orgName }),
    register: (userId, orgName, role, adminId) => api.post('/register', { userId, orgName, role, adminId })
};

export const assetsAPI = {
    create: (data) => api.post('/assets', data),
    getPrivate: (id, collection) => api.get(`/assets/${id}`, { params: { collection } }),
    getPublic: (id) => api.get(`/assets/public/${id}`)
};

export const transitAPI = {
    simulate: (batchId, scenario = 'normal') => api.post('/transit/simulate', { batchId, scenario }),
    generateProof: (batchId) => api.post('/transit/generate-proof', { batchId }),
    verify: (batchId, proofHash) => api.post('/transit/verify', { batchId, proofHash }),
    getTransit: (batchId) => api.get(`/transit/${batchId}`),
    publicVerify: (batchId) => api.get(`/transit/public/${batchId}`)
};

export default api;


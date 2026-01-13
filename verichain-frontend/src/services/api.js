import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Send cookies with requests
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Redirect to login on auth failure
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (userId, orgName) => api.post('/login', { userId, orgName }),
    logout: () => api.post('/logout'),
    me: () => api.get('/me')
};

export const assetsAPI = {
    create: (data) => api.post('/assets', data),
    list: (org) => api.get('/assets', { params: { org } }),
    getPrivate: (id, collection) => api.get(`/assets/${id}`, { params: { collection } }),
    getPublic: (id) => api.get(`/assets/public/${id}`)
};

export const transitAPI = {
    simulate: (batchId, scenario = 'normal') => api.post('/transit/simulate', { batchId, scenario }),
    generateProof: (batchId) => api.post('/transit/generate-proof', { batchId }),
    verify: (batchId, proofHash) => api.post('/transit/verify', { batchId, proofHash }),
    getTransit: (batchId) => api.get(`/transit/${batchId}`),
    publicVerify: (batchId) => api.get(`/transit/public/${batchId}`),
    notarize: (data) => api.post('/transit/notarize', data)
};

export const inventoryAPI = {
    getPending: () => api.get('/inventory/pending'),
    getInventory: () => api.get('/inventory'),
    accept: (assetId) => api.post('/inventory', { assetId })
};

export default api;

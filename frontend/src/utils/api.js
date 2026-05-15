export { teamAPI } from './teamApi';
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

// Projects
export const projectsAPI = {
  getAll: () => API.get('/projects'),
  getOne: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  addMember: (id, data) => API.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => API.delete(`/projects/${id}/members/${userId}`),
  updateMemberRole: (id, userId, role) => API.put(`/projects/${id}/members/${userId}/role`, { role }),
};

// Tasks
export const tasksAPI = {
  getAll: (projectId, params) => API.get(`/projects/${projectId}/tasks`, { params }),
  getOne: (projectId, taskId) => API.get(`/projects/${projectId}/tasks/${taskId}`),
  create: (projectId, data) => API.post(`/projects/${projectId}/tasks`, data),
  update: (projectId, taskId, data) => API.put(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId, taskId) => API.delete(`/projects/${projectId}/tasks/${taskId}`),
  addComment: (projectId, taskId, text) => API.post(`/projects/${projectId}/tasks/${taskId}/comments`, { text }),
};

// Dashboard
export const dashboardAPI = {
  get: () => API.get('/dashboard'),
};

export default API;

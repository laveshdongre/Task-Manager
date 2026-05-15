import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/team',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const teamAPI = {
  getAll: () => API.get('/'),
  getOne: (id) => API.get(`/${id}`),
  updateStatus: (data) => API.patch('/status', data),
  updateRole: (id, role) => API.patch(`/role/${id}`, { role }),
  remove: (id) => API.delete(`/${id}`),
};

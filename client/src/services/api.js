import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://focusflow-pro-api.onrender.com'
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const register        = (data) => API.post('/auth/register', data);
export const login           = (data) => API.post('/auth/login', data);
export const getMe           = ()     => API.get('/auth/me');
export const updatePrefs     = (data) => API.put('/auth/preferences', data);

export const startSession    = (data) => API.post('/session/start', data);
export const endSession      = (data) => API.post('/session/end', data);
export const getActiveSession= ()     => API.get('/session/active');
export const getHistory      = ()     => API.get('/session/history');
export const trackDistraction= (data) => API.post('/session/distraction', data);

export const addSite         = (data) => API.post('/block/add', data);
export const getSites        = ()     => API.get('/block/list');
export const removeSite      = (id)   => API.delete(`/block/remove/${id}`);
export const updateProfile   = (data) => API.put('/block/profile', data);
export const resetAttempts   = ()     => API.post('/block/reset');

export const getStats        = ()     => API.get('/stats');
export const getWeeklyReport = ()     => API.get('/stats/weekly');
export const getHeatmap      = ()     => API.get('/stats/heatmap');

export const createGoal      = (data) => API.post('/goals', data);
export const getGoals        = ()     => API.get('/goals');
export const updateGoal      = (id, data) => API.put(`/goals/${id}`, data);
export const deleteGoal      = (id)   => API.delete(`/goals/${id}`);

export const createRoom      = (data) => API.post('/social/room/create', data);
export const joinRoom        = (id)   => API.post(`/social/room/join/${id}`);
export const getRoom         = (id)   => API.get(`/social/room/${id}`);
export const getLeaderboard  = ()     => API.get('/social/leaderboard');
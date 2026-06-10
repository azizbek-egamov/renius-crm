import api from './api';

export const getMarketing = () => api.get('/marketing/');
export const createMarketing = (data) => api.post('/marketing/', data);
export const updateMarketing = (id, data) => api.patch(`/marketing/${id}/`, data);
export const deleteMarketing = (id) => api.delete(`/marketing/${id}/`);

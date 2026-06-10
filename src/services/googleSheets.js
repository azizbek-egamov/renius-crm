import api from './api';

export const getGlobalSyncConfig = () => api.get('/google-sheets-config/');
export const updateGlobalSyncConfig = (id, data) => api.patch(`/google-sheets-config/${id}/`, data);
export const syncGoogleSheetsNow = () => api.post('/google-sheets-config/sync_now/');

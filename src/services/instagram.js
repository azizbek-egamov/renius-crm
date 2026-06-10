import api from './api';

export const instagramService = {
    // Profil ma'lumotlari
    getProfile: async (accountId = null) => {
        return api.get('/instagram/profile/', { params: { account_id: accountId } });
    },

    // OAuth URL olish
    getAuthUrl: async (redirectUri) => {
        return api.get('/instagram/auth-url/', { params: { redirect_uri: redirectUri } });
    },

    // OAuth callback — code bilan token olish
    connectAccount: async (code, redirectUri) => {
        return api.post('/instagram/callback/', { code, redirect_uri: redirectUri });
    },

    // Akkauntni uzish
    disconnect: async (accountId) => {
        return api.post('/instagram/disconnect/', { account_id: accountId });
    },

    // Insights statistika
    getStats: async (period = 'day', accountId = null) => {
        return api.get('/instagram/stats/', { params: { period, account_id: accountId } });
    },

    // Media (postlar) ro'yxati
    getMedia: async (limit = 20, accountId = null) => {
        return api.get('/instagram/media/', { params: { limit, account_id: accountId } });
    },

    // Barcha akkauntlar ro'yxati
    getAccounts: async () => {
        return api.get('/instagram/accounts/');
    },

    // Chatlar ro'yxati
    getConversations: async (accountId = null) => {
        return api.get('/instagram/conversations/', { params: { account_id: accountId } });
    },

    // Chat tarixi
    getMessages: async (threadId, accountId = null) => {
        return api.get(`/instagram/threads/${threadId}/messages/`, { params: { account_id: accountId } });
    },

    // Xabar yuborish
    sendMessage: async (recipientId, text, accountId = null) => {
        return api.post('/instagram/send-message/', { recipient_id: recipientId, text, account_id: accountId });
    },
};

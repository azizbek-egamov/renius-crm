import api from './api';

export const getFinanceSummary = async () => {
    return api.get('/finance/summary/');
};

export const getDebtors = async () => {
    return api.get('/finance/debtors/');
};

export const getExpenses = async (params) => {
    return api.get('/expenses/', { params });
};

export const createExpense = async (data) => {
    return api.post('/expenses/', data);
};

export const updateExpense = async (id, data) => {
    return api.put(`/expenses/${id}/`, data);
};

export const deleteExpense = async (id) => {
    return api.delete(`/expenses/${id}/`);
};

export const financeService = {
    getFinanceSummary,
    getDebtors,
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense
};

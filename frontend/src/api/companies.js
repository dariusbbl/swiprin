import client from './client';

export const getCompanies  = (page = 0, size = 10) => client.get(`/companies?page=${page}&size=${size}`);
export const createCompany = (data)        => client.post('/companies', data);
export const updateCompany = (id, data)    => client.put(`/companies/${id}`, data);
export const verifyCompany = (id)          => client.put(`/companies/${id}/verify`);
export const deleteCompany = (id)          => client.delete(`/companies/${id}`);

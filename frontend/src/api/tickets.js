import client from './client';

export const submitTicket  = (data)         => client.post('/tickets', data);
export const getMyTickets  = (page = 0)     => client.get(`/tickets/me?page=${page}&size=10`);
export const getAllTickets  = (status, page, category) =>
  client.get(`/tickets?page=${page}&size=10${status ? `&status=${status}` : ''}${category ? `&category=${category}` : ''}`);
export const resolveTicket = (id)            => client.put(`/tickets/${id}/resolve`);
export const inProgressTicket = (id)        => client.put(`/tickets/${id}/in-progress`);
export const deleteTicket        = (id) => client.delete(`/tickets/${id}`);
export const approveDeletion     = (id) => client.post(`/tickets/${id}/approve-deletion`);

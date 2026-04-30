import client from './client';

export const submitTicket  = (data)         => client.post('/tickets', data);
export const getMyTickets  = (page = 0)     => client.get(`/tickets/me?page=${page}&size=10`);
export const getAllTickets  = (status, page) => client.get(`/tickets?page=${page}&size=20${status ? `&status=${status}` : ''}`);
export const resolveTicket = (id)            => client.put(`/tickets/${id}/resolve`);
export const inProgressTicket = (id)        => client.put(`/tickets/${id}/in-progress`);
export const deleteTicket  = (id)            => client.delete(`/tickets/${id}`);

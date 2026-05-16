import client from './client';

export const getNotifications    = (page = 0, size = 20) => client.get(`/notifications?page=${page}&size=${size}`);
export const getUnreadCount      = ()                    => client.get('/notifications/unread-count');
export const markOneAsRead       = (id)                  => client.put(`/notifications/${id}/read`);
export const markAllAsRead       = ()                    => client.put('/notifications/read-all');

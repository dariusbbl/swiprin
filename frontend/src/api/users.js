import client from './client';

export const getUsers        = (page = 0, role)  => client.get(`/users?page=${page}&size=20${role ? `&role=${role}` : ''}`);
export const toggleUserStatus = (id, enabled)    => client.put(`/users/${id}/status`, { enabled });
export const deleteUser       = (id)             => client.delete(`/users/${id}`);

export const getMyProfile     = ()               => client.get('/users/me/profile');
export const upsertProfile    = (data)           => client.put('/users/me/profile', data);
export const getFaculties     = ()               => client.get('/users/profile/faculties');

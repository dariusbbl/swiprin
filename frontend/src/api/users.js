import client from './client';

export const getUsers        = (page = 0, role)  => client.get(`/users?page=${page}&size=20${role ? `&role=${role}` : ''}`);
export const setUserStatus    = (id, status)     => client.put(`/users/${id}/status`, null, { params: { status } });
export const deleteUser       = (id)             => client.delete(`/users/${id}`);

export const getMe            = ()               => client.get('/users/me');
export const getMyProfile     = ()               => client.get('/users/me/profile');
export const upsertProfile    = (data)           => client.put('/users/me/profile', data);
export const getFaculties     = ()               => client.get('/users/profile/faculties');

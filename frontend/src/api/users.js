import client from './client';

export const getUsers = (page = 0, role, companyName) => {
  const params = new URLSearchParams({ page, size: 10 });
  if (role)        params.append('role', role);
  if (companyName) params.append('companyName', companyName);
  return client.get(`/users?${params}`);
};
export const setUserStatus    = (id, status)     => client.put(`/users/${id}/status`, null, { params: { status } });
export const deleteUser       = (id)             => client.delete(`/users/${id}`);

export const getMe            = ()               => client.get('/users/me');
export const updateMe         = (data)           => client.put('/users/me', data);
export const getMyProfile     = ()               => client.get('/users/me/profile');
export const upsertProfile    = (data)           => client.put('/users/me/profile', data);
export const getFaculties     = ()               => client.get('/users/profile/faculties');

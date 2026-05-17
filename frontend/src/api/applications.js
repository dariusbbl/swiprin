import client from './client';

export const getMyApplications      = (page = 0, status) => client.get(`/applications/me?page=${page}&size=10${status ? `&status=${status}` : ''}`);
export const getMyApplicationCounts = ()                 => client.get('/applications/me/counts');
export const getJobApplications  = (jobId, page = 0, status, search) => client.get(`/applications/job/${jobId}?page=${page}&size=10${status ? `&status=${status}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
export const applyToJob          = (data)              => client.post('/applications', data);
export const withdrawApplication = (id)               => client.put(`/applications/${id}/withdraw`);
export const updateAppStatus     = (id, status)       => client.put(`/applications/${id}/status`, { status });
export const deleteApplication   = (id)               => client.delete(`/applications/${id}`);

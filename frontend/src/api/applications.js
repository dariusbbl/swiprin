import client from './client';

export const getMyApplications      = (page = 0, status, shortlisted, sortBy = 'appliedAt', sortDir = 'desc') =>
  client.get(`/applications/me?page=${page}&size=10${status ? `&status=${status}` : ''}${shortlisted != null ? `&shortlisted=${shortlisted}` : ''}&sortBy=${sortBy}&sortDir=${sortDir}`);
export const getMyApplicationCounts = ()                 => client.get('/applications/me/counts');
export const getJobApplications  = (jobId, page = 0, status, shortlisted, sortBy = 'matchPercent', sortDir = 'desc') =>
  client.get(`/applications/job/${jobId}?page=${page}&size=20${status ? `&status=${status}` : ''}${shortlisted != null ? `&shortlisted=${shortlisted}` : ''}&sortBy=${sortBy}&sortDir=${sortDir}`);
export const applyToJob          = (data)              => client.post('/applications', data);
export const withdrawApplication = (id)               => client.put(`/applications/${id}/withdraw`);
export const updateAppStatus     = (id, status)       => client.put(`/applications/${id}/status`, { status });
export const deleteApplication   = (id)               => client.delete(`/applications/${id}`);
export const toggleShortlist          = (id) => client.put(`/applications/${id}/shortlist`);
export const getShortlistedCount      = ()  => client.get('/applications/shortlisted/count');

import client from './client';

export const getJobFeed       = (page = 0, seniority, location) => client.get(`/jobs/feed?page=${page}&size=6${seniority ? `&seniority=${seniority}` : ''}${location ? `&location=${encodeURIComponent(location)}` : ''}`);
export const getMyJobs        = (page = 0, active, size = 10) => client.get(`/jobs/my?page=${page}&size=${size}${active != null ? `&activeOnly=${active}` : ''}`);
export const getJobById       = (id)                 => client.get(`/jobs/${id}`);
export const createJob        = (data)               => client.post('/jobs', data);
export const updateJob        = (id, data)           => client.put(`/jobs/${id}`, data);
export const deleteJob        = (id)                 => client.delete(`/jobs/${id}`);
export const getSkills        = ()                   => client.get('/skills');

import client from './client';

export const getJobFeed       = (page = 0)          => client.get(`/jobs/feed?page=${page}&size=6`);
export const getMyJobs        = (page = 0, active)   => client.get(`/jobs/mine?page=${page}&size=10${active != null ? `&activeOnly=${active}` : ''}`);
export const getJobById       = (id)                 => client.get(`/jobs/${id}`);
export const createJob        = (data)               => client.post('/jobs', data);
export const updateJob        = (id, data)           => client.put(`/jobs/${id}`, data);
export const deleteJob        = (id)                 => client.delete(`/jobs/${id}`);
export const getSkills        = ()                   => client.get('/skills');

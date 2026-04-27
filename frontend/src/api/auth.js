import client from './client';

export const login = (data) => client.post('/auth/login', data);
export const registerCandidate = (data) => client.post('/auth/register/candidate', data);
export const registerRecruiter = (data) => client.post('/auth/register/recruiter', data);

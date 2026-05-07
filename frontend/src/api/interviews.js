import client from './client';

export const scheduleInterview    = (appId, data) => client.post(`/applications/${appId}/interviews`, data);
export const getAppInterviews     = (appId)       => client.get(`/applications/${appId}/interviews`);
export const getMyAppInterviews   = (appId)       => client.get(`/applications/${appId}/my-interviews`);
export const updateInterview      = (id, data)    => client.put(`/applications/interviews/${id}`, data);

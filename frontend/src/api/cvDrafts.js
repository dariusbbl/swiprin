import client from './client';

export const getCvDrafts    = ()         => client.get('/cv-drafts');
export const createCvDraft  = (data)     => client.post('/cv-drafts', data);
export const updateCvDraft  = (id, data) => client.put(`/cv-drafts/${id}`, data);
export const setDefaultCv   = (id)       => client.put(`/cv-drafts/${id}/default`);
export const deleteCvDraft  = (id)       => client.delete(`/cv-drafts/${id}`);

export const uploadCvFile = (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post(`/cv-drafts/${id}/upload`, form);
};

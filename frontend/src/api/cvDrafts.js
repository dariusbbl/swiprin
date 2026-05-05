import client from './client';

export const getCvDrafts    = ()         => client.get('/cv-drafts');
export const createCvDraft  = (data)     => client.post('/cv-drafts', data);
export const updateCvDraft  = (id, data) => client.put(`/cv-drafts/${id}`, data);
export const setDefaultCv   = (id)       => client.put(`/cv-drafts/${id}/default`);
export const deleteCvDraft  = (id)       => client.delete(`/cv-drafts/${id}`);

export const uploadCvFile = async (id, file) => {
  const form = new FormData();
  form.append('file', file);
  const token = window.__swiprin_token;
  const res = await fetch(`/api/cv-drafts/${id}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    // Content-Type intentionally omitted — browser sets multipart/form-data; boundary=... automatically
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message ?? 'Upload failed');
    err.response = { data };
    throw err;
  }
  return res.json();
};

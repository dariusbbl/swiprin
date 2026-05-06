import client from './client';

export const getSkills = (size = 200) => client.get(`/skills?page=0&size=${size}`);

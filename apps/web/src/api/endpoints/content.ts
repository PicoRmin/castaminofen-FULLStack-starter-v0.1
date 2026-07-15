import { apiRequest } from '../client';

export const contentApi = {
  getFeed: () => apiRequest('/feed'),
  getPodcast: (slug: string) => apiRequest(`/podcasts/${slug}`),
};

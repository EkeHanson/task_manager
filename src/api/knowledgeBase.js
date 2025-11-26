import { knowledgeBaseInstance as api } from './axios';

export const knowledgeBaseAPI = {
  // Categories
  getCategories: () => api.get('/categories/'),
  createCategory: (data) => api.post('/categories/', data),
  updateCategory: (id, data) => api.put(`/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}/`),

  // Tags
  getTags: () => api.get('/tags/'),
  createTag: (data) => api.post('/tags/', data),
  updateTag: (id, data) => api.put(`/tags/${id}/`, data),
  deleteTag: (id) => api.delete(`/tags/${id}/`),

  // Articles
  getArticles: (params = {}) => {
    const defaultParams = { page_size: 12, ...params };
    return api.get('/articles/', { params: defaultParams });
  },
  getPublishedArticles: (params = {}) => {
    const defaultParams = { page_size: 12, ...params };
    return api.get('/articles/');
  },
  getMyArticles: () => api.get('/articles/my_articles/'),
  getFeaturedArticles: () => api.get('/articles/featured/'),
  getArticle: (id) => api.get(`/articles/${id}/`),
  createArticle: (data) => api.post('/articles/', data),
  updateArticle: (id, data) => api.put(`/articles/${id}/`, data),
  deleteArticle: (id) => api.delete(`/articles/${id}/`),
  incrementArticleView: (id) => api.post(`/articles/${id}/increment_view/`),
};
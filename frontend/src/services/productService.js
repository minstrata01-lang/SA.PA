/**
 * Product Service — API calls for product data
 */
import api from './api';

export const productService = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
};

export default productService;

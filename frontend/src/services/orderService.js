import api from './api';

export const orderService = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getStatus: (orderId) => api.get(`/orders/${orderId}/status`),
};

export default orderService;

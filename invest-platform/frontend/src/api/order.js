import api from './index';

export const orderApi = {
  // 创建订单
  createOrder: (data) => api.post('/orders', data),
  
  // 获取订单列表
  getOrders: (params) => api.get('/orders', { params }),
  
  // 获取持仓
  getPositions: () => api.get('/orders/positions'),
};

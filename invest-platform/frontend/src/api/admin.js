import api from './index';

export const adminApi = {
  // 更新产品价格
  updateProductPrice: (data) => api.put('/admin/products/:id/price', data),
  
  // 添加K线数据
  addKLineData: (data) => api.post('/admin/products/kline', data),
  
  // 创建产品
  createProduct: (data) => api.post('/admin/products', data),
  
  // 审核提现
  auditWithdraw: (requestId, data) => api.put(`/admin/withdraw/${requestId}/audit`, data),
  
  // 审核实名认证
  auditVerification: (userId, data) => api.put(`/admin/users/${userId}/verify`, data),
  
  // 获取统计数据
  getStats: (params) => api.get('/admin/stats', { params }),
  
  // 获取操作日志
  getAdminLogs: (params) => api.get('/admin/logs', { params }),
};

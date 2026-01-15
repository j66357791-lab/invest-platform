import api from './index';

export const productApi = {
  // 获取产品列表
  getProducts: (params) => api.get('/products', { params }),
  
  // 获取产品详情
  getProduct: (id) => api.get(`/products/${id}`),
  
  // 获取K线数据
  getKLineData: (id, params) => api.get(`/products/${id}/kline`, { params }),
  
  // 获取排行榜
  getRankings: (params) => api.get('/products/rankings', { params }),
};

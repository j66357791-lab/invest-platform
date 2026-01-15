import api from './index';

export const walletApi = {
  // 充值
  deposit: (data) => api.post('/wallet/deposit', data),
  
  // 提现
  withdraw: (data) => api.post('/wallet/withdraw', data),
  
  // 获取交易记录
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  
  // 获取收益统计
  getProfitStats: (params) => api.get('/wallet/profit-stats', { params }),
};

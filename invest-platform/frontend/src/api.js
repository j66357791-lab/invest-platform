import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== 用户API ====================
export const register = (data) => api.post('/register', data);
export const login = (data) => api.post('/login', data);

// ==================== 道具API ====================
export const getProducts = (params) => api.get('/products', { params });
export const getProductDetail = (id) => api.get(`/products/${id}`);

// ==================== 钱包API ====================
export const getWallet = () => api.get('/wallet');
export const deposit = (data) => api.post('/wallet/deposit', data);
export const withdraw = (data) => api.post('/wallet/withdraw', data);
export const getTransactions = (params) => api.get('/wallet/transactions', { params });

// ==================== 交易API ====================
export const getHoldings = () => api.get('/holdings');
export const buyProduct = (data) => api.post('/trade/buy', data);
export const sellProduct = (data) => api.post('/trade/sell', data);

// ==================== 管理员API ====================
export const adminUpdatePrice = (data) => api.post('/admin/update-price', data);
export const adminCreateProduct = (data) => api.post('/admin/products', data);
export const adminGetProducts = () => api.get('/admin/products');
export const adminAuditWithdraw = (id, data) => api.put(`/admin/withdraw/${id}`, data);
export const adminVerifyUser = (id, data) => api.put(`/admin/verify-user/${id}`, data);

export default api;

import api from './index';

export const userApi = {
  // 注册
  register: (data) => api.post('/users/register', data),
  
  // 登录
  login: (data) => api.post('/users/login', data),
  
  // 获取用户信息
  getProfile: () => api.get('/users/profile'),
  
  // 提交实名认证
  submitVerification: (data) => api.post('/users/verify', data),
};

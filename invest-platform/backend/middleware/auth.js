import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ error: '账户已被禁用' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: '认证失败', message: error.message });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

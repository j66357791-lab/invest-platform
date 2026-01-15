export const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未认证' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  
  next();
};

export const superAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未认证' });
  }
  
  if (req.user.role !== 'superAdmin') {
    return res.status(403).json({ error: '需要超级管理员权限' });
  }
  
  next();
};

export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    if (req.user.role === 'superAdmin') {
      return next();
    }
    
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: '没有该权限' });
    }
    
    next();
  };
};

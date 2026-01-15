import AdminLog from '../models/AdminLog.js';

export const logAdminAction = (module, action) => {
  return async (req, res, next) => {
    // 保存原始的res.json
    const originalJson = res.json;
    
    // 重写res.json以记录响应
    res.json = function(data) {
      // 只记录管理员操作
      if (req.user && (req.user.role === 'admin' || req.user.role === 'superAdmin')) {
        // 异步记录日志，不影响响应
        AdminLog.create({
          admin: req.user._id,
          module,
          action,
          details: {
            method: req.method,
            path: req.path,
            body: req.body,
            query: req.query,
            params: req.params,
            response: data
          },
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent') || ''
        }).catch(err => console.error('记录管理员日志失败:', err));
      }
      
      // 调用原始的res.json
      return originalJson.call(this, data);
    };
    
    next();
  };
};

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 操作模块
  module: {
    type: String,
    required: true,
    enum: [
      'user',
      'product',
      'order',
      'withdraw',
      'verification',
      'system',
      'settlement',
      'commission',
      'admin'
    ],
    default: 'system'
  },
  
  // 操作类型
  action: {
    type: String,
    required: true
  },
  
  // 操作详情
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // 关联数据
  targetType: {
    type: String,
    default: ''
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  // IP地址
  ip: {
    type: String,
    default: ''
  },
  
  // User-Agent
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ module: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AdminLog', adminLogSchema);

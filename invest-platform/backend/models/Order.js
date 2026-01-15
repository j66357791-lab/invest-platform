import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  // 订单类型
  type: {
    type: String,
    required: true,
    enum: ['buy', 'sell'],
    default: 'buy'
  },
  
  // 交易信息
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 金额和手续费
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  actualAmount: {
    type: Number,
    required: true
  },
  
  // 状态
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  
  // 订单来源
  source: {
    type: String,
    enum: ['user', 'system', 'settlement'],
    default: 'user'
  },
  
  // 原因说明
  reason: {
    type: String,
    default: ''
  },
  
  // 关联持仓
  positionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    default: null
  },
  
  // 审核信息
  auditStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  auditUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  auditTime: {
    type: Date,
    default: null
  },
  auditRemark: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ product: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);

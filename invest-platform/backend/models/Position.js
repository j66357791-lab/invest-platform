import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema({
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
  
  // 持仓信息
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  frozenQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 成本信息
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 收益信息
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  profitPercent: {
    type: Number,
    default: 0
  },
  
  // 止盈止损
  stopProfitPrice: {
    type: Number,
    default: 0
  },
  stopLossPrice: {
    type: Number,
    default: 0
  },
  autoClose: {
    type: Boolean,
    default: true
  },
  
  // 状态
  status: {
    type: String,
    enum: ['open', 'closed', 'partially_closed', 'forced_closed'],
    default: 'open'
  },
  
  // 最后更新时间
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
positionSchema.index({ user: 1, product: 1, status: 1 });
positionSchema.index({ user: 1, status: 1 });
positionSchema.index({ product: 1, status: 1 });

// 虚拟字段
positionSchema.virtual('marketValue').get(function() {
  return this.quantity * this.currentPrice;
});

positionSchema.virtual('availableQuantity').get(function() {
  return this.quantity - this.frozenQuantity;
});

export default mongoose.model('Position', positionSchema);

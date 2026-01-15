import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // 板块分类
  category: {
    type: String,
    required: true,
    enum: ['physical', 'virtual', 'game'],
    default: 'virtual'
  },
  subCategory: {
    type: String,
    default: ''
  },
  
  // 图片
  images: [{
    type: String,
    default: []
  }],
  
  // 当前价格
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 涨跌幅数据
  priceChanges: {
    daily: {
      type: Number,
      default: 0
    },
    weekly: {
      type: Number,
      default: 0
    },
    monthly: {
      type: Number,
      default: 0
    },
    yearly: {
      type: Number,
      default: 0
    }
  },
  
  // 止盈止损
  stopProfit: {
    type: Number,
    default: 0,
    min: 0
  },
  stopLoss: {
    type: Number,
    default: 0,
    min: 0
  },
  autoClose: {
    type: Boolean,
    default: true
  },
  
  // 交易规则
  minTradeAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  maxTradeAmount: {
    type: Number,
    default: 100000
  },
  minUnit: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  
  // 手续费
  feeRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.001 // 0.1%
  },
  
  // 提现限制
  withdrawalRules: {
    minAmount: {
      type: Number,
      default: 100
    },
    maxAmount: {
      type: Number,
      default: 100000
    },
    dailyLimit: {
      type: Number,
      default: 100000
    },
    cooldownPeriod: {
      type: Number,
      default: 24 // 小时
    }
  },
  
  // 购买限制
  purchaseLimit: {
    maxDailyBuy: {
      type: Number,
      default: 1000
    },
    maxTotalHold: {
      type: Number,
      default: 10000
    }
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'delisted'],
    default: 'active'
  },
  
  // 统计
  totalVolume: {
    type: Number,
    default: 0
  },
  dailyVolume: {
    type: Number,
    default: 0
  },
  popularity: {
    type: Number,
    default: 0
  },
  
  // 注意事项
  notices: [{
    type: String,
    default: []
  }],
  
  // 创建者
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 最后更新者
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
productSchema.index({ code: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ currentPrice: -1 });
productSchema.index({ popularity: -1 });
productSchema.index({ dailyVolume: -1 });
productSchema.index({ priceChanges: -1 });

// 虚拟字段
productSchema.virtual('changeRate').get(function() {
  const change = this.priceChanges.daily || 0;
  const prevPrice = this.currentPrice / (1 + change);
  return change * 100;
});

export default mongoose.model('Product', productSchema);

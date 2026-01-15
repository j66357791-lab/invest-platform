import mongoose from 'mongoose';

const kLineSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  // 周期
  period: {
    type: String,
    required: true,
    enum: ['day', 'week', 'month', 'year'],
    default: 'day'
  },
  
  // K线数据
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  open: {
    type: Number,
    required: true,
    min: 0
  },
  high: {
    type: Number,
    required: true,
    min: 0
  },
  low: {
    type: Number,
    required: true,
    min: 0
  },
  close: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 成交量和成交额
  volume: {
    type: Number,
    default: 0,
    min: 0
  },
  amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 涨跌幅
  change: {
    type: Number,
    default: 0
  },
  changePercent: {
    type: Number,
    default: 0
  },
  
  // 前收盘价（计算涨跌幅用）
  prevClose: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
kLineSchema.index({ product: 1, period: 1, timestamp: -1 });
kLineSchema.index({ timestamp: -1 });

export default mongoose.model('KLine', kLineSchema);

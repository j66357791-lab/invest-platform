const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  // 基本信息
  name: { type: String, required: true },
  symbol: { type: String, required: true, unique: true }, // 如 "GOLD_SWORD"
  description: { type: String },
  icon: { type: String }, // 道具图片URL
  
  // 板块分类
  category: { type: String, enum: ['physical', 'virtual', 'game'], required: true },
  
  // 价格信息
  currentPrice: { type: Number, default: 0 }, // 当前价格
  issuePrice: { type: Number, default: 0 },   // 发行价
  
  // 涨跌幅数据（系统自动计算）
  changeDay: { type: Number, default: 0 },    // 日涨跌幅 %
  changeWeek: { type: Number, default: 0 },   // 周涨跌幅 %
  changeMonth: { type: Number, default: 0 },  // 月涨跌幅 %
  changeYear: { type: Number, default: 0 },   // 年涨跌幅 %
  
  // 交易规则（管理员配置）
  minUnit: { type: Number, default: 1 },      // 最小交易单位
  feeRate: { type: Number, default: 0.01 },   // 交易手续费率 1%
  
  // 止盈止损
  stopProfitRate: { type: Number, default: 0 }, // 止盈比例 %
  stopLossRate: { type: Number, default: 0 },   // 止损比例 %
  
  // 购买限制
  maxHoldings: { type: Number, default: 999999 }, // 最大持仓数量
  withdrawLockDays: { type: Number, default: 0 }, // 提现锁定天数
  
  // 注意事项
  notes: { type: String },
  
  // 状态
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);

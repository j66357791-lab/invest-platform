const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  
  // 持仓信息
  amount: { type: Number, default: 0 },       // 持仓数量
  costPrice: { type: Number, default: 0 },    // 成本价
  totalCost: { type: Number, default: 0 },    // 总成本
  
  // 收益（系统每日更新）
  currentPrice: { type: Number, default: 0 }, // 当前价格
  profit: { type: Number, default: 0 },       // 收益金额
  profitRate: { type: Number, default: 0 },    // 收益率 %
  
  // 止盈止损状态
  stopProfitTriggered: { type: Boolean, default: false },
  stopLossTriggered: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

HoldingSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Holding', HoldingSchema);

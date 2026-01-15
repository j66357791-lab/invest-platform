// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 道具名称
  code: { type: String, unique: true },   // 道具代码 (如 "GAME_SKIN_001")
  category: { 
    type: String, 
    required: true, 
    enum: ['实物', '虚拟', '游戏'] 
  },
  image: { type: String, default: '' },   // 道具图片URL
  description: { type: String, default: '' }, // 简短介绍
  
  // 价格与K线
  currentPrice: { type: Number, default: 0 }, // 当前最新价
  status: { type: Number, default: 1 }, // 1上架, 0下架
  
  // 交易规则
  feeRate: { type: Number, default: 0.005 }, // 默认手续费 0.5% (管理员上架时可改)
  minAmount: { type: Number, default: 1 },   // 最小购买单位
  maxHoldAmount: { type: Number }, // 单人最大持仓量限制
  
  // 止盈止损 (管理员设置比例)
  stopProfitRate: { type: Number }, // 如 0.2 代表 20%
  stopLossRate: { type: Number },   // 如 -0.1 代表 -10%
  
  // 提现限制
  minWithdrawDays: { type: Number, default: 0 }, // 买入后几天才能提现
  
  // 统计
  tradeVolume: { type: Number, default: 0 }, // 累计交易量
  popularity: { type: Number, default: 0 },  // 人气值
  
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);

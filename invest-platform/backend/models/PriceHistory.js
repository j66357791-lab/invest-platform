const mongoose = require('mongoose');

const PriceHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  date: { type: Date, required: true }, // 日期
  
  // K线数据
  open: { type: Number, required: true },   // 开盘价
  high: { type: Number, required: true },   // 最高价
  low: { type: Number, required: true },    // 最低价
  close: { type: Number, required: true },  // 收盘价
  
  // 参考基准（用于计算涨跌幅）
  dayOpen: { type: Number },   // 日开盘价基准
  weekOpen: { type: Number },  // 周开盘价基准
  monthOpen: { type: Number }, // 月开盘价基准
  yearOpen: { type: Number },  // 年开盘价基准
  
  createdAt: { type: Date, default: Date.now }
});

// 复合索引：产品ID + 日期
PriceHistorySchema.index({ productId: 1, date: -1 });

module.exports = mongoose.model('PriceHistory', PriceHistorySchema);

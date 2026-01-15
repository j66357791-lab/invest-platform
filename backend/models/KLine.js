// models/KLine.js
const KLineSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  type: { type: String, enum: ['1d', '1w', '1M', '1Y'] }, // 周期
  timestamp: Date, // 该K线的时间点 (如日线则是当天的0点)
  open: Number, // 开盘价
  high: Number, // 最高价
  low: Number,  // 最低价
  close: Number,// 收盘价
  changePercent: Number, // 涨跌幅
});

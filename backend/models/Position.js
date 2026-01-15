// models/Position.js
const PositionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  amount: Number, // 持仓数量
  costPrice: Number, // 建仓成本价
  currentPrice: Number, // 当前市价 (随结算更新)
  profitLoss: Number, // 累计浮动盈亏
  status: { type: Number, default: 1, enum: [1, 2] }, // 1持仓中, 2已平仓
  
  // 触发平仓的原因记录
  closeReason: { type: String, enum: ['manual', 'stop_profit', 'stop_loss'] },
  closedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

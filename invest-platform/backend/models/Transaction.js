// models/Transaction.js (资金流水)
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['recharge', 'withdraw', 'buy', 'sell', 'fee', 'commission'] },
  amount: Number, // 金额 (正数为进, 负数为出)
  balanceAfter: Number, // 操作后余额
  desc: String,
  relatedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  createdAt: { type: Date, default: Date.now }
});

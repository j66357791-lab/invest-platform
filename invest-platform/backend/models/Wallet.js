const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // 余额
  balance: { type: Number, default: 0 },      // 可用余额
  frozen: { type: Number, default: 0 },       // 冻结资金
  
  // 今日收益
  todayProfit: { type: Number, default: 0 },  // 今日收益
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 流水子文档
const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['deposit', 'withdraw', 'buy', 'sell', 'profit', 'commission', 'fee'], required: true },
  amount: { type: Number, required: true },   // 金额（正数为收入，负数为支出）
  balance: { type: Number, required: true },  // 交易后余额
  description: { type: String },              // 说明
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // 关联订单
  createdAt: { type: Date, default: Date.now }
});

// 流水表
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Wallet: mongoose.model('Wallet', WalletSchema), Transaction };

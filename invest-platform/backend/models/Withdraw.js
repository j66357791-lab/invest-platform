const mongoose = require('mongoose');

const WithdrawSchema = new mongoose.Schema({
  withdrawNo: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 提现信息
  amount: { type: Number, required: true },
  bankName: { type: String },
  bankCard: { type: String },
  accountName: { type: String },
  
  // 状态
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  auditRemark: { type: String },
  
  // 审核信息
  auditorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  auditedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Withdraw', WithdrawSchema);

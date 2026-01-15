const mongoose = require('mongoose');

const InviteCommissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 推荐人
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 被推荐人
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  
  // 返佣信息
  fee: { type: Number, required: true },       // 手续费
  commission: { type: Number, required: true }, // 返佣金额
  rate: { type: Number, required: true },       // 返佣比例
  
  // 层级
  level: { type: Number, enum: [1, 2], required: true }, // 1=直推, 2=间推
  
  // 状态
  status: { type: String, enum: ['pending', 'settled'], default: 'pending' },
  settledAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InviteCommission', InviteCommissionSchema);

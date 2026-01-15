import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 交易类型
  type: {
    type: String,
    required: true,
    enum: [
      'deposit',      // 充值
      'withdraw',     // 提现
      'buy',          // 买入
      'sell',         // 卖出
      'fee',          // 手续费
      'commission',   // 返佣
      'profit',       // 盈利
      'loss',         // 亏损
      'settlement',   // 结算
      'refund',       // 退款
      'freeze',       // 冻结
      'unfreeze',     // 解冻
      'adjust'        // 调整
    ],
    default: 'buy'
  },
  
  // 金额（正数表示增加，负数表示减少）
  amount: {
    type: Number,
    required: true
  },
  
  // 变化后的余额
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // 关联订单
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  
  // 关联产品
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  
  // 描述
  description: {
    type: String,
    default: ''
  },
  
  // 备注
  remark: {
    type: String,
    default: ''
  },
  
  // 状态
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ productId: 1 });

export default mongoose.model('Transaction', transactionSchema);

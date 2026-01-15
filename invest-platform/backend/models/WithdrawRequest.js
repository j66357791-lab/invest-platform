import mongoose from 'mongoose';

const withdrawRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 提现信息
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 银行账户信息
  bankName: {
    type: String,
    required: true
  },
  bankAccount: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  
  // 状态
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // 审核信息
  auditUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  auditTime: {
    type: Date,
    default: null
  },
  auditRemark: {
    type: String,
    default: ''
  },
  
  // 完成信息
  completedAt: {
    type: Date,
    default: null
  },
  transactionNo: {
    type: String,
    default: ''
  },
  
  // 失败原因
  failReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
withdrawRequestSchema.index({ user: 1, createdAt: -1 });
withdrawRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('WithdrawRequest', withdrawRequestSchema);

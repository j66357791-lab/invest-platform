import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  invitee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 关联订单
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  // 返佣类型
  type: {
    type: String,
    required: true,
    enum: ['direct', 'indirect'],
    default: 'direct'
  },
  
  // 金额
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 返佣比例
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  
  // 基础金额（订单金额）
  baseAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 状态
  status: {
    type: String,
    enum: ['pending', 'calculated', 'paid'],
    default: 'pending'
  },
  
  // 支付时间
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
commissionSchema.index({ inviter: 1, createdAt: -1 });
commissionSchema.index({ invitee: 1, createdAt: -1 });
commissionSchema.index({ orderId: 1 });

export default mongoose.model('Commission', commissionSchema);

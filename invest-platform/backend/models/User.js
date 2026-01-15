import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // 基本信息
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  
  // 资金信息
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  frozenBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 实名认证
  realName: {
    type: String,
    default: ''
  },
  idCard: {
    type: String,
    default: ''
  },
  idCardFront: {
    type: String,
    default: '' // 图片路径
  },
  idCardBack: {
    type: String,
    default: '' // 图片路径
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationRejectReason: {
    type: String,
    default: ''
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  
  // 邀请码和返佣
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
  },
  inviterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  invitedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commissionBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCommission: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 风控
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  isFrozen: {
    type: Boolean,
    default: false
  },
  freezeReason: {
    type: String,
    default: ''
  },
  
  // 角色
  role: {
    type: String,
    enum: ['user', 'admin', 'superAdmin'],
    default: 'user'
  },
  adminPosition: {
    type: String,
    default: '' // 管理员岗位
  },
  permissions: [{
    type: String,
    default: []
  }],
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  
  // 其他
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLoginIP: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ inviteCode: 1 });
userSchema.index({ inviterId: 1 });
userSchema.index({ createdAt: -1 });

// 虚拟字段
userSchema.virtual('totalBalance').get(function() {
  return this.balance + this.frozenBalance;
});

userSchema.virtual('invitedCount').get(function() {
  return this.invitedUsers ? this.invitedUsers.length : 0;
});

// 实例方法
userSchema.methods.matchPassword = async function(enteredPassword) {
  const bcrypt = await import('bcryptjs');
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.addInvitedUser = async function(userId) {
  if (!this.invitedUsers.includes(userId)) {
    this.invitedUsers.push(userId);
    await this.save();
  }
};

userSchema.methods.updateCommission = async function(amount) {
  this.commissionBalance += amount;
  if (amount > 0) {
    this.totalCommission += amount;
  }
  await this.save();
};

export default mongoose.model('User', userSchema);

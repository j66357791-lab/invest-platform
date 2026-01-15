// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true }, // 手机号作为登录账号
  password: { type: String, required: true },
  username: { type: String, default: '玩家' }, // 昵称
  avatar: { type: String, default: '' },
  
  // 资金相关
  balance: { type: Number, default: 0.00 }, // 可用余额
  frozenBalance: { type: Number, default: 0.00 }, // 冻结金额 (下单时占用)
  
  // 身份相关
  role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' }, // 角色
  realNameStatus: { type: Number, default: 0, enum: [0, 1, 2, 3] }, // 0未认证, 1审核中, 2已通过, 3拒绝
  realName: String, // 真实姓名
  idCard: String,  // 身份证号
  
  // 推广相关
  inviteCode: { type: String, unique: true }, // 我的邀请码
  parentInviteCode: String, // 上级的邀请码
  
  status: { type: Number, default: 1 }, // 1正常, 0封号
}, {
  timestamps: true // 自动生成 createdAt, updatedAt
});

// 保存前自动加密密码
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 密码比对方法
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // 基本信息
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' },
  
  // 邀请关系
  inviteCode: { type: String, required: true, unique: true },  // 自己的邀请码
  inviterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 邀请人ID
  
  // 实名认证
  realName: { type: String, default: '' },
  idCard: { type: String, default: '' },
  idVerified: { type: Boolean, default: false },  // 是否已认证
  idVerifyStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: '' },
  
  // 账户状态
  status: { type: String, enum: ['active', 'frozen', 'banned'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);

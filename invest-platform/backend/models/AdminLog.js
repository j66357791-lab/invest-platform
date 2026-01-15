const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // 操作类型
  target: { type: String },                // 操作对象
  detail: { type: mongoose.Schema.Types.Mixed }, // 详细信息
  
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminLog', AdminLogSchema);

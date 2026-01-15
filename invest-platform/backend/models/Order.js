const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true }, // 订单号
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  
  // 订单类型
  type: { type: String, enum: ['buy', 'sell'], required: true },
  
  // 交易信息
  amount: { type: Number, required: true },     // 数量
  price: { type: Number, required: true },      // 价格
  totalAmount: { type: Number, required: true }, // 总金额
  fee: { type: Number, required: true },        // 手续费
  
  // 状态
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Order', OrderSchema);

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Position from '../models/Position.js';
import Transaction from '../models/Transaction.js';
import Commission from '../models/Commission.js';
import moment from 'moment';

// 创建订单
export const createOrder = async (req, res) => {
  try {
    const { productId, type, quantity } = req.body;
    const userId = req.user._id;
    
    // 查找产品
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: '道具不存在' });
    }
    
    if (product.status !== 'active') {
      return res.status(400).json({ error: '道具不可交易' });
    }
    
    // 检查交易数量
    if (quantity < product.minUnit) {
      return res.status(400).json({ 
        error: `最小交易单位为 ${product.minUnit}` 
      });
    }
    
    // 计算金额和手续费
    const price = product.currentPrice;
    const amount = quantity * price;
    const fee = amount * product.feeRate;
    const actualAmount = type === 'buy' ? amount + fee : amount - fee;
    
    // 检查用户余额（买入时）
    if (type === 'buy') {
      const user = await import('../models/User.js').then(m => m.default.findById(userId));
      if (user.balance < actualAmount) {
        return res.status(400).json({ error: '余额不足' });
      }
      
      // 扣除余额
      user.balance -= actualAmount;
      await user.save();
    }
    
    // 查找或创建持仓
    let position = await Position.findOne({
      user: userId,
      product: productId,
      status: 'open'
    });
    
    if (type === 'buy') {
      if (position) {
        // 更新现有持仓
        const totalQuantity = position.quantity + quantity;
        const totalCost = position.totalCost + amount;
        
        position.quantity = totalQuantity;
        position.totalCost = totalCost;
        position.costPrice = totalCost / totalQuantity;
        position.currentPrice = price;
        position.lastUpdatedAt = new Date();
        
        await position.save();
      } else {
        // 创建新持仓
        position = new Position({
          user: userId,
          product: productId,
          quantity,
          costPrice: price,
          totalCost: amount,
          currentPrice: price,
          stopProfitPrice: price * (1 + product.stopProfit),
          stopLossPrice: price * (1 - product.stopLoss),
          autoClose: product.autoClose
        });
        
        await position.save();
      }
    } else if (type === 'sell') {
      if (!position || position.quantity - position.frozenQuantity < quantity) {
        return res.status(400).json({ error: '持仓不足' });
      }
      
      // 更新持仓
      position.quantity -= quantity;
      if (position.quantity === 0) {
        position.status = 'closed';
      }
      position.lastUpdatedAt = new Date();
      await position.save();
    }
    
    // 生成订单号
    const orderNo = moment().format('YYYYMMDDHHmmss') + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 创建订单
    const order = new Order({
      orderNo,
      user: userId,
      product: productId,
      type,
      quantity,
      price,
      amount,
      fee,
      actualAmount,
      status: 'completed',
      positionId: position._id
    });
    
    await order.save();
    
    // 创建交易记录
    await Transaction.create({
      user: userId,
      type: type === 'buy' ? 'buy' : 'sell',
      amount: type === 'buy' ? -actualAmount : actualAmount,
      balanceAfter: (await import('../models/User.js').then(m => m.default.findById(userId))).balance,
      orderId: order._id,
      productId,
      description: `${type === 'buy' ? '买入' : '卖出'} ${product.name} ${quantity}个`
    });
    
    // 更新产品统计
    if (type === 'buy') {
      product.totalVolume += quantity;
      product.dailyVolume += quantity;
      product.popularity += 1;
    }
    await product.save();
    
    // 返佣计算
    await calculateCommission(userId, order);
    
    res.json({
      message: '订单创建成功',
      order,
      position
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ error: '创建订单失败', message: error.message });
  }
};

// 计算返佣
const calculateCommission = async (userId, order) => {
  try {
    const User = await import('../models/User.js').then(m => m.default);
    const user = await User.findById(userId);
    
    if (!user.inviterId) return;
    
    // 直推返佣 (10%)
    const directCommission = order.fee * 0.1;
    const inviter = await User.findById(user.inviterId);
    
    if (inviter) {
      await Commission.create({
        inviter: inviter._id,
        invitee: userId,
        orderId: order._id,
        type: 'direct',
        amount: directCommission,
        rate: 0.1,
        baseAmount: order.fee,
        status: 'calculated'
      });
      
      await inviter.updateCommission(directCommission);
    }
    
    // 间推返佣 (5%)
    if (inviter && inviter.inviterId) {
      const indirectCommission = order.fee * 0.05;
      const indirectInviter = await User.findById(inviter.inviterId);
      
      if (indirectInviter) {
        await Commission.create({
          inviter: indirectInviter._id,
          invitee: userId,
          orderId: order._id,
          type: 'indirect',
          amount: indirectCommission,
          rate: 0.05,
          baseAmount: order.fee,
          status: 'calculated'
        });
        
        await indirectInviter.updateCommission(indirectCommission);
      }
    }
  } catch (error) {
    console.error('计算返佣错误:', error);
  }
};

// 获取用户订单列表
export const getUserOrders = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.user._id };
    if (status) query.status = status;
    if (type) query.type = type;
    
    const orders = await Order.find(query)
      .populate('product', 'name code currentPrice')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ error: '获取订单列表失败', message: error.message });
  }
};

// 获取用户持仓
export const getUserPositions = async (req, res) => {
  try {
    const positions = await Position.find({
      user: req.user._id,
      status: 'open'
    })
    .populate('product', 'name code currentPrice priceChanges images category')
    .sort({ createdAt: -1 });
    
    res.json(positions);
  } catch (error) {
    console.error('获取持仓错误:', error);
    res.status(500).json({ error: '获取持仓失败', message: error.message });
  }
};

export default {
  createOrder,
  getUserOrders,
  getUserPositions
};

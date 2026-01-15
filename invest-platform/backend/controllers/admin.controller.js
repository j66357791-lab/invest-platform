import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';
import WithdrawRequest from '../models/WithdrawRequest.js';
import User from '../models/User.js';
import Commission from '../models/Commission.js';
import KLine from '../models/KLine.js';
import Position from '../models/Position.js';
import AdminLog from '../models/AdminLog.js';
import moment from 'moment';

// 更新产品价格（管理员手动录入）
export const updateProductPrice = async (req, res) => {
  try {
    const { productId, price, timestamp } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: '道具不存在' });
    }
    
    const previousPrice = product.currentPrice;
    const newPrice = price;
    
    // 更新产品价格
    product.currentPrice = newPrice;
    product.lastUpdatedBy = req.user._id;
    
    // 计算日涨跌幅
    const dailyChange = (newPrice - previousPrice) / previousPrice;
    product.priceChanges.daily = dailyChange;
    
    // 更新K线数据（日线）
    const today = moment().startOf('day').toDate();
    let kLine = await KLine.findOne({
      product: productId,
      period: 'day',
      timestamp: today
    });
    
    if (kLine) {
      // 更新当天K线
      kLine.close = newPrice;
      kLine.high = Math.max(kLine.high, newPrice);
      kLine.low = Math.min(kLine.low, newPrice);
      kLine.prevClose = previousPrice;
      kLine.change = newPrice - previousPrice;
      kLine.changePercent = dailyChange;
    } else {
      // 创建新K线
      kLine = new KLine({
        product: productId,
        period: 'day',
        timestamp: today,
        open: previousPrice,
        high: Math.max(previousPrice, newPrice),
        low: Math.min(previousPrice, newPrice),
        close: newPrice,
        prevClose: previousPrice,
        change: newPrice - previousPrice,
        changePercent: dailyChange
      });
    }
    
    await kLine.save();
    await product.save();
    
    // 记录日志
    await AdminLog.create({
      admin: req.user._id,
      module: 'product',
      action: 'update_price',
      details: {
        productId,
        productName: product.name,
        previousPrice,
        newPrice,
        change: dailyChange
      },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      message: '价格更新成功',
      product,
      kLine
    });
  } catch (error) {
    console.error('更新产品价格错误:', error);
    res.status(500).json({ error: '更新产品价格失败', message: error.message });
  }
};

// 添加历史K线数据
export const addKLineData = async (req, res) => {
  try {
    const { productId, period, kLineData } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: '道具不存在' });
    }
    
    // 批量创建K线数据
    const createdKLines = [];
    for (const data of kLineData) {
      const kLine = new KLine({
        product: productId,
        period,
        timestamp: new Date(data.timestamp),
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume || 0,
        amount: data.amount || 0
      });
      
      await kLine.save();
      createdKLines.push(kLine);
    }
    
    // 更新产品的周、月、年涨跌幅
    await updateProductPeriodChanges(productId);
    
    // 记录日志
    await AdminLog.create({
      admin: req.user._id,
      module: 'product',
      action: 'add_kline_data',
      details: {
        productId,
        productName: product.name,
        period,
        count: kLineData.length
      },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      message: 'K线数据添加成功',
      kLines: createdKLines
    });
  } catch (error) {
    console.error('添加K线数据错误:', error);
    res.status(500).json({ error: '添加K线数据失败', message: error.message });
  }
};

// 更新产品周期涨跌幅
const updateProductPeriodChanges = async (productId) => {
  try {
    const product = await Product.findById(productId);
    
    // 获取各周期的最新K线数据
    const dayKLine = await KLine.findOne({ product: productId, period: 'day' }).sort({ timestamp: -1 });
    const weekKLine = await KLine.findOne({ product: productId, period: 'week' }).sort({ timestamp: -1 });
    const monthKLine = await KLine.findOne({ product: productId, period: 'month' }).sort({ timestamp: -1 });
    const yearKLine = await KLine.findOne({ product: productId, period: 'year' }).sort({ timestamp: -1 });
    
    if (dayKLine && dayKLine.prevClose) {
      product.priceChanges.daily = (dayKLine.close - dayKLine.prevClose) / dayKLine.prevClose;
    }
    
    if (weekKLine && weekKLine.prevClose) {
      product.priceChanges.weekly = (weekKLine.close - weekKLine.prevClose) / weekKLine.prevClose;
    }
    
    if (monthKLine && monthKLine.prevClose) {
      product.priceChanges.monthly = (monthKLine.close - monthKLine.prevClose) / monthKLine.prevClose;
    }
    
    if (yearKLine && yearKLine.prevClose) {
      product.priceChanges.yearly = (yearKLine.close - yearKLine.prevClose) / yearKLine.prevClose;
    }
    
    await product.save();
  } catch (error) {
    console.error('更新产品周期涨跌幅错误:', error);
  }
};

// 上架新产品
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // 生成产品代码（如果未提供）
    if (!productData.code) {
      productData.code = 'PROD' + Date.now();
    }
    
    productData.createdBy = req.user._id;
    
    const product = new Product(productData);
    await product.save();
    
    // 记录日志
    await AdminLog.create({
      admin: req.user._id,
      module: 'product',
      action: 'create_product',
      details: {
        productId: product._id,
        productName: product.name,
        productCode: product.code
      },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json({
      message: '产品上架成功',
      product
    });
  } catch (error) {
    console.error('上架产品错误:', error);
    res.status(500).json({ error: '上架产品失败', message: error.message });
  }
};

// 审核提现申请
export const auditWithdraw = async (req, res) => {
  try {
    const { requestId, status, remark } = req.body;
    
    const withdrawRequest = await WithdrawRequest.findById(requestId)
      .populate('user');
    
    if (!withdrawRequest) {
      return res.status(404).json({ error: '提现申请不存在' });
    }
    
    if (withdrawRequest.status !== 'pending') {
      return res.status(400).json({ error: '该申请已处理' });
    }
    
    const user = withdrawRequest.user;
    
    if (status === 'approved') {
      // 通过审核
      withdrawRequest.status = 'completed';
      withdrawRequest.auditUserId = req.user._id;
      withdrawRequest.auditTime = new Date();
      withdrawRequest.completedAt = new Date();
      
      // 解冻并扣除余额
      user.frozenBalance -= withdrawRequest.amount;
      await user.save();
      
      // 创建交易记录
      await Transaction.create({
        user: user._id,
        type: 'withdraw',
        amount: -withdrawRequest.amount,
        balanceAfter: user.balance,
        description: '提现成功',
        remark: `提现至 ${withdrawRequest.bankName} ${withdrawRequest.bankAccount}`
      });
    } else if (status === 'rejected') {
      // 拒绝审核
      withdrawRequest.status = 'rejected';
      withdrawRequest.auditUserId = req.user._id;
      withdrawRequest.auditTime = new Date();
      withdrawRequest.auditRemark = remark || '';
      
      // 解冻并返还余额
      user.frozenBalance -= withdrawRequest.amount;
      user.balance += withdrawRequest.amount;
      await user.save();
      
      // 创建交易记录
      await Transaction.create({
        user: user._id,
        type: 'unfreeze',
        amount: withdrawRequest.amount,
        balanceAfter: user.balance,
        description: '提现被拒绝，资金返还',
        remark
      });
    }
    
    await withdrawRequest.save();
    
    // 记录日志
    await AdminLog.create({
      admin: req.user._id,
      module: 'withdraw',
      action: 'audit_withdraw',
      details: {
        requestId,
        userId: user._id,
        username: user.username,
        amount: withdrawRequest.amount,
        status,
        remark
      },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      message: '提现审核完成',
      withdrawRequest
    });
  } catch (error) {
    console.error('审核提现错误:', error);
    res.status(500).json({ error: '审核提现失败', message: error.message });
  }
};

// 审核实名认证
export const auditVerification = async (req, res) => {
  try {
    const { userId, status, remark } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    if (user.verificationStatus !== 'pending') {
      return res.status(400).json({ error: '该用户实名状态不是待审核' });
    }
    
    if (status === 'approved') {
      user.verificationStatus = 'verified';
      user.verifiedAt = new Date();
    } else if (status === 'rejected') {
      user.verificationStatus = 'rejected';
      user.verificationRejectReason = remark || '';
      user.realName = '';
      user.idCard = '';
      user.idCardFront = '';
      user.idCardBack = '';
    }
    
    await user.save();
    
    // 记录日志
    await AdminLog.create({
      admin: req.user._id,
      module: 'verification',
      action: 'audit_verification',
      details: {
        userId,
        username: user.username,
        status,
        remark
      },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      message: '实名认证审核完成',
      user
    });
  } catch (error) {
    console.error('审核实名认证错误:', error);
    res.status(500).json({ error: '审核实名认证失败', message: error.message });
  }
};

// 获取统计数据
export const getStats = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    
    // 根据周期计算时间范围
    let startDate = moment().startOf('day').toDate();
    switch (period) {
      case 'daily':
        startDate = moment().startOf('day').toDate();
        break;
      case 'weekly':
        startDate = moment().startOf('week').toDate();
        break;
      case 'monthly':
        startDate = moment().startOf('month').toDate();
        break;
    }
    
    // 用户统计
    const totalUsers = await User.countDocuments({ status: 'active' });
    const newUsers = await User.countDocuments({ 
      status: 'active',
      createdAt: { $gte: startDate }
    });
    
    // 产品统计
    const totalProducts = await Product.countDocuments({ status: 'active' });
    const activeProducts = await Product.find({ status: 'active' });
    
    // 交易统计
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });
    const totalVolume = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // 提现统计
    const pendingWithdraws = await WithdrawRequest.countDocuments({
      status: 'pending'
    });
    const pendingAmount = await WithdrawRequest.aggregate([
      {
        $match: {
          status: 'pending'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // 实名认证统计
    const pendingVerifications = await User.countDocuments({
      verificationStatus: 'pending'
    });
    
    res.json({
      period,
      users: {
        total: totalUsers,
        new: newUsers
      },
      products: {
        total: totalProducts,
        list: activeProducts.map(p => ({
          id: p._id,
          name: p.name,
          code: p.code,
          currentPrice: p.currentPrice,
          priceChanges: p.priceChanges
        }))
      },
      orders: {
        total: totalOrders,
        volume: totalVolume[0]?.total || 0
      },
      withdraws: {
        pending: pendingWithdraws,
        pendingAmount: pendingAmount[0]?.total || 0
      },
      verifications: {
        pending: pendingVerifications
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ error: '获取统计数据失败', message: error.message });
  }
};

// 获取操作日志
export const getAdminLogs = async (req, res) => {
  try {
    const { module, action, adminId, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (module) query.module = module;
    if (action) query.action = action;
    if (adminId) query.admin = adminId;
    
    const logs = await AdminLog.find(query)
      .populate('admin', 'username')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const total = await AdminLog.countDocuments(query);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({ error: '获取操作日志失败', message: error.message });
  }
};

export default {
  updateProductPrice,
  addKLineData,
  createProduct,
  auditWithdraw,
  auditVerification,
  getStats,
  getAdminLogs
};

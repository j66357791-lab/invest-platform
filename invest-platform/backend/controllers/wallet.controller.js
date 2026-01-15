import Transaction from '../models/Transaction.js';
import WithdrawRequest from '../models/WithdrawRequest.js';
import User from '../models/User.js';
import moment from 'moment';

// 充值（人工充值，管理员审核）
export const deposit = async (req, res) => {
  try {
    const { amount, method, remark } = req.body;
    
    if (amount <= 0) {
      return res.status(400).json({ error: '充值金额必须大于0' });
    }
    
    // 创建待审核的交易记录
    const transaction = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount,
      balanceAfter: req.user.balance, // 充值前余额
      description: '人工充值',
      remark: remark || '',
      status: 'pending'
    });
    
    await transaction.save();
    
    res.json({
      message: '充值申请已提交，等待管理员审核',
      transaction
    });
  } catch (error) {
    console.error('充值错误:', error);
    res.status(500).json({ error: '充值失败', message: error.message });
  }
};

// 提现申请
export const withdraw = async (req, res) => {
  try {
    const { amount, bankName, bankAccount, accountName } = req.body;
    
    // 检查用户实名状态
    if (req.user.verificationStatus !== 'verified') {
      return res.status(403).json({ error: '请先完成实名认证' });
    }
    
    // 检查余额
    if (req.user.balance < amount) {
      return res.status(400).json({ error: '余额不足' });
    }
    
    // 冻结金额
    const user = await User.findById(req.user._id);
    user.balance -= amount;
    user.frozenBalance += amount;
    await user.save();
    
    // 创建提现申请
    const withdrawRequest = new WithdrawRequest({
      user: req.user._id,
      amount,
      bankName,
      bankAccount,
      accountName,
      status: 'pending'
    });
    
    await withdrawRequest.save();
    
    // 创建交易记录
    await Transaction.create({
      user: req.user._id,
      type: 'freeze',
      amount: -amount,
      balanceAfter: user.balance,
      description: '提现冻结',
      remark: `提现至 ${bankName} ${bankAccount}`
    });
    
    res.json({
      message: '提现申请已提交，等待审核',
      withdrawRequest
    });
  } catch (error) {
    console.error('提现错误:', error);
    res.status(500).json({ error: '提现失败', message: error.message });
  }
};

// 获取资金流水
export const getTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.user._id };
    if (type) query.type = type;
    if (status) query.status = status;
    
    const transactions = await Transaction.find(query)
      .populate('orderId', 'orderNo type quantity price')
      .populate('productId', 'name code')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取资金流水错误:', error);
    res.status(500).json({ error: '获取资金流水失败', message: error.message });
  }
};

// 获取收益统计
export const getProfitStats = async (req, res) => {
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
      case 'yearly':
        startDate = moment().startOf('year').toDate();
        break;
    }
    
    // 查询交易记录
    const transactions = await Transaction.find({
      user: req.user._id,
      type: { $in: ['profit', 'loss', 'sell'] },
      createdAt: { $gte: startDate }
    });
    
    // 计算收益
    let totalProfit = 0;
    let totalLoss = 0;
    
    transactions.forEach(t => {
      if (t.type === 'profit') {
        totalProfit += t.amount;
      } else if (t.type === 'loss') {
        totalLoss += Math.abs(t.amount);
      } else if (t.type === 'sell') {
        // 卖出收益需要从持仓收益计算
        // 这里简化处理，实际需要从持仓获取
      }
    });
    
    // 查询当前持仓收益
    const Position = await import('../models/Position.js').then(m => m.default);
    const positions = await Position.find({
      user: req.user._id,
      status: 'open'
    });
    
    let currentPositionProfit = 0;
    positions.forEach(p => {
      currentPositionProfit += p.profit;
    });
    
    res.json({
      period,
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss,
      currentPositionProfit,
      totalNetProfit: totalProfit - totalLoss + currentPositionProfit
    });
  } catch (error) {
    console.error('获取收益统计错误:', error);
    res.status(500).json({ error: '获取收益统计失败', message: error.message });
  }
};

export default {
  deposit,
  withdraw,
  getTransactions,
  getProfitStats
};

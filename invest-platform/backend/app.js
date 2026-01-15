const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');

// 连接数据库
const MONGO_URI = 'mongodb+srv://j66357791_db_user:hjh628727@cluster0.oiwbvje.mongodb.net/chaowan-db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB连接成功'))
  .catch(err => console.error('❌ MongoDB连接失败:', err));

const app = express();
app.use(cors());
app.use(express.json());

// JWT密钥
const JWT_SECRET = 'your-secret-key-change-in-production';

// 引入模型
const User = require('./models/User');
const Product = require('./models/Product');
const Holding = require('./models/Holding');
const Order = require('./models/Order');
const PriceHistory = require('./models/PriceHistory');
const { Wallet, Transaction } = require('./models/Wallet');
const Withdraw = require('./models/Withdraw');
const InviteCommission = require('./models/Invite');
const AdminLog = require('./models/AdminLog');

// ==================== 中间件 ====================

// 验证Token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: '未登录' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token无效' });
  }
};

// 验证管理员权限
const adminMiddleware = async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
    return res.status(403).json({ error: '无管理员权限' });
  }
  next();
};

// ==================== 用户相关API ====================

// 注册
app.post('/api/register', async (req, res) => {
  try {
    const { phone, password, inviteCode } = req.body;
    
    // 检查手机号是否存在
    const existUser = await User.findOne({ phone });
    if (existUser) return res.status(400).json({ error: '手机号已注册' });
    
    // 查找邀请人
    let inviter = null;
    if (inviteCode) {
      inviter = await User.findOne({ inviteCode });
    }
    
    // 生成自己的邀请码
    const myInviteCode = 'INV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await User.create({
      phone,
      password: hashedPassword,
      inviteCode: myInviteCode,
      inviterId: inviter?._id
    });
    
    // 创建钱包
    await Wallet.create({ userId: user._id, balance: 0 });
    
    // 生成Token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ token, user: { id: user._id, phone: user.phone, nickname: user.nickname, inviteCode: user.inviteCode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 登录
app.post('/api/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    
    if (!user) return res.status(400).json({ error: '用户不存在' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: '密码错误' });
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ token, user: { id: user._id, phone: user.phone, nickname: user.nickname, inviteCode: user.inviteCode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 道具相关API ====================

// 获取道具列表
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category, status: 'active' } : { status: 'active' };
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取道具详情
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: '道具不存在' });
    
    // 获取K线数据
    const klineData = await PriceHistory.find({ productId: product._id })
      .sort({ date: 1 })
      .limit(365);
    
    res.json({ ...product.toObject(), klineData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 钱包相关API ====================

// 获取钱包信息
app.get('/api/wallet', authMiddleware, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 充值（人工审核）
app.post('/api/wallet/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount, transferImage } = req.body;
    
    const wallet = await Wallet.findOne({ userId: req.user._id });
    
    // 创建充值记录（待审核）
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount: Number(amount),
      balance: wallet.balance,
      description: '充值申请（待审核）',
      status: 'pending',
      extra: { transferImage }
    });
    
    res.json({ message: '充值申请已提交，等待审核', transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 提现申请
app.post('/api/wallet/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount, bankName, bankCard, accountName } = req.body;
    
    // 检查是否实名
    if (!req.user.idVerified) {
      return res.status(400).json({ error: '请先完成实名认证' });
    }
    
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet.balance < amount) {
      return res.status(400).json({ error: '余额不足' });
    }
    
    // 冻结资金
    wallet.balance -= Number(amount);
    wallet.frozen += Number(amount);
    await wallet.save();
    
    // 创建提现申请
    const withdraw = await Withdraw.create({
      withdrawNo: 'WD' + Date.now(),
      userId: req.user._id,
      amount: Number(amount),
      bankName,
      bankCard,
      accountName
    });
    
    res.json({ message: '提现申请已提交', withdraw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取交易明细
app.get('/api/wallet/transactions', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Transaction.countDocuments({ userId: req.user._id });
    
    res.json({ transactions, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 交易相关API ====================

// 获取持仓列表
app.get('/api/holdings', authMiddleware, async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user._id })
      .populate('productId');
    res.json(holdings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 买入道具
app.post('/api/trade/buy', authMiddleware, async (req, res) => {
  try {
    const { productId, amount } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: '道具不存在' });
    if (product.status !== 'active') return res.status(400).json({ error: '道具已下架' });
    
    // 检查最小交易单位
    if (amount < product.minUnit) {
      return res.status(400).json({ error: `最小交易单位为${product.minUnit}` });
    }
    
    const totalAmount = amount * product.currentPrice;
    const fee = totalAmount * product.feeRate;
    const totalWithFee = totalAmount + fee;
    
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet.balance < totalWithFee) {
      return res.status(400).json({ error: '余额不足' });
    }
    
    // 扣除余额
    wallet.balance -= totalWithFee;
    await wallet.save();
    
    // 创建订单
    const order = await Order.create({
      orderNo: 'ORD' + Date.now(),
      userId: req.user._id,
      productId,
      type: 'buy',
      amount,
      price: product.currentPrice,
      totalAmount,
      fee,
      status: 'completed',
      completedAt: new Date()
    });
    
    // 更新持仓
    let holding = await Holding.findOne({ userId: req.user._id, productId });
    if (holding) {
      // 已有持仓，更新成本价
      const oldTotalCost = holding.amount * holding.costPrice;
      const newTotalCost = oldTotalCost + totalAmount;
      holding.amount += amount;
      holding.costPrice = newTotalCost / holding.amount;
      holding.totalCost = newTotalCost;
      holding.currentPrice = product.currentPrice;
      holding.updatedAt = new Date();
    } else {
      // 新建持仓
      holding = await Holding.create({
        userId: req.user._id,
        productId,
        amount,
        costPrice: product.currentPrice,
        totalCost: totalAmount,
        currentPrice: product.currentPrice
      });
    }
    await holding.save();
    
    // 记录交易流水
    await Transaction.create({
      userId: req.user._id,
      type: 'buy',
      amount: -totalWithFee,
      balance: wallet.balance,
      description: `买入 ${product.name} ${amount}个`,
      orderId: order._id
    });
    
    // 计算返佣（直推10%，间推5%）
    await processCommission(req.user._id, fee, order._id);
    
    res.json({ message: '购买成功', order, holding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 卖出道具
app.post('/api/trade/sell', authMiddleware, async (req, res) => {
  try {
    const { productId, amount } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: '道具不存在' });
    
    const holding = await Holding.findOne({ userId: req.user._id, productId });
    if (!holding) return res.status(400).json({ error: '暂无持仓' });
    if (holding.amount < amount) return res.status(400).json({ error: '持仓不足' });
    
    // 检查提现锁定
    const daysSinceBuy = Math.floor((new Date() - holding.createdAt) / (1000 * 60 * 60 * 24));
    if (daysSinceBuy < product.withdrawLockDays) {
      return res.status(400).json({ error: `需持有${product.withdrawLockDays}天后才能卖出` });
    }
    
    const totalAmount = amount * product.currentPrice;
    const fee = totalAmount * product.feeRate;
    const netAmount = totalAmount - fee;
    
    // 增加余额
    const wallet = await Wallet.findOne({ userId: req.user._id });
    wallet.balance += netAmount;
    await wallet.save();
    
    // 创建订单
    const order = await Order.create({
      orderNo: 'ORD' + Date.now(),
      userId: req.user._id,
      productId,
      type: 'sell',
      amount,
      price: product.currentPrice,
      totalAmount,
      fee,
      status: 'completed',
      completedAt: new Date()
    });
    
    // 更新持仓
    holding.amount -= amount;
    holding.totalCost -= (amount * holding.costPrice);
    if (holding.amount === 0) {
      await Holding.deleteOne({ _id: holding._id });
    } else {
      await holding.save();
    }
    
    // 记录交易流水
    await Transaction.create({
      userId: req.user._id,
      type: 'sell',
      amount: netAmount,
      balance: wallet.balance,
      description: `卖出 ${product.name} ${amount}个`,
      orderId: order._id
    });
    
    res.json({ message: '卖出成功', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 处理返佣
async function processCommission(userId, fee, orderId) {
  const user = await User.findById(userId);
  if (!user.inviterId) return;
  
  // 直推返佣 10%
  const directCommission = fee * 0.10;
  if (directCommission > 0) {
    const inviterWallet = await Wallet.findOne({ userId: user.inviterId });
    if (inviterWallet) {
      inviterWallet.balance += directCommission;
      await inviterWallet.save();
      
      await InviteCommission.create({
        userId: user.inviterId,
        fromUserId: userId,
        orderId,
        fee,
        commission: directCommission,
        rate: 0.10,
        level: 1,
        status: 'settled',
        settledAt: new Date()
      });
    }
  }
  
  // 间推返佣 5%
  const inviter = await User.findById(user.inviterId);
  if (inviter && inviter.inviterId) {
    const indirectCommission = fee * 0.05;
    const inviterWallet = await Wallet.findOne({ userId: inviter.inviterId });
    if (inviterWallet) {
      inviterWallet.balance += indirectCommission;
      await inviterWallet.save();
      
      await InviteCommission.create({
        userId: inviter.inviterId,
        fromUserId: userId,
        orderId,
        fee,
        commission: indirectCommission,
        rate: 0.05,
        level: 2,
        status: 'settled',
        settledAt: new Date()
      });
    }
  }
}

// ==================== 管理员API ====================

// 上架道具
app.post('/api/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    // 记录日志
    await AdminLog.create({
      adminId: req.user._id,
      action: 'create_product',
      target: product._id,
      detail: { productName: product.name }
    });
    
    res.json({ message: '道具上架成功', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新道具
app.put('/api/admin/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    await AdminLog.create({
      adminId: req.user._id,
      action: 'update_product',
      target: product._id,
      detail: { productName: product.name }
    });
    
    res.json({ message: '道具更新成功', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新每日价格（核心功能）
app.post('/api/admin/update-price', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId, date, open, high, low, close, dayOpen, weekOpen, monthOpen, yearOpen } = req.body;
    
    // 获取产品
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: '道具不存在' });
    
    // 保存K线数据
    await PriceHistory.create({
      productId,
      date: new Date(date),
      open, high, low, close,
      dayOpen, weekOpen, monthOpen, yearOpen
    });
    
    // 计算涨跌幅
    const changeDay = dayOpen ? ((close - dayOpen) / dayOpen * 100).toFixed(2) : 0;
    const changeWeek = weekOpen ? ((close - weekOpen) / weekOpen * 100).toFixed(2) : 0;
    const changeMonth = monthOpen ? ((close - monthOpen) / monthOpen * 100).toFixed(2) : 0;
    const changeYear = yearOpen ? ((close - yearOpen) / yearOpen * 100).toFixed(2) : 0;
    
    // 更新产品价格和涨跌幅
    product.currentPrice = close;
    product.changeDay = Number(changeDay);
    product.changeWeek = Number(changeWeek);
    product.changeMonth = Number(changeMonth);
    product.changeYear = Number(changeYear);
    product.updatedAt = new Date();
    await product.save();
    
    // 更新所有用户持仓收益
    const holdings = await Holding.find({ productId });
    for (const holding of holdings) {
      holding.currentPrice = close;
      holding.profit = (close - holding.costPrice) * holding.amount;
      holding.profitRate = ((close - holding.costPrice) / holding.costPrice * 100).toFixed(2);
      
      // 检查止盈止损
      if (product.stopProfitRate > 0 && holding.profitRate >= product.stopProfitRate) {
        holding.stopProfitTriggered = true;
        // TODO: 自动平仓逻辑
      }
      if (product.stopLossRate > 0 && holding.profitRate <= -product.stopLossRate) {
        holding.stopLossTriggered = true;
        // TODO: 自动平仓逻辑
      }
      
      await holding.save();
      
      // 更新用户钱包今日收益
      const wallet = await Wallet.findOne({ userId: holding.userId });
      wallet.todayProfit = (wallet.todayProfit || 0) + (holding.profit || 0);
      await wallet.save();
    }
    
    // 记录日志
    await AdminLog.create({
      adminId: req.user._id,
      action: 'update_price',
      target: productId,
      detail: { price: close, changes: { changeDay, changeWeek, changeMonth, changeYear } }
    });
    
    res.json({ message: '价格更新成功，用户收益已同步' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有道具（管理员）
app.get('/api/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 审批提现
app.put('/api/admin/withdraw/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, remark } = req.body;
    
    const withdraw = await Withdraw.findById(req.params.id);
    if (!withdraw) return res.status(404).json({ error: '提现申请不存在' });
    
    if (status === 'approved') {
      // 解冻并扣除余额
      const wallet = await Wallet.findOne({ userId: withdraw.userId });
      wallet.frozen -= withdraw.amount;
      await wallet.save();
      
      // 记录流水
      await Transaction.create({
        userId: withdraw.userId,
        type: 'withdraw',
        amount: -withdraw.amount,
        balance: wallet.balance,
        description: '提现到银行卡'
      });
    } else if (status === 'rejected') {
      // 退还冻结余额
      const wallet = await Wallet.findOne({ userId: withdraw.userId });
      wallet.frozen -= withdraw.amount;
      wallet.balance += withdraw.amount;
      await wallet.save();
    }
    
    withdraw.status = status;
    withdraw.auditRemark = remark;
    withdraw.auditorId = req.user._id;
    withdraw.auditedAt = new Date();
    await withdraw.save();
    
    res.json({ message: '审核完成' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 实名认证审核
app.put('/api/admin/verify-user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, remark } = req.body;
    
    const user = await User.findById(req.params.id);
    user.idVerifyStatus = status;
    user.idVerified = status === 'approved';
    await user.save();
    
    res.json({ message: '审核完成' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 定时任务 ====================

// 每日凌晨2点结算（可选，管理员手动更新价格即可）
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 开始每日结算...');
  // 结算逻辑由管理员手动触发价格更新完成
  console.log('✅ 每日结算完成');
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
});

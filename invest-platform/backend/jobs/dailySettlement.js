// jobs/dailySettlement.js
import cron from 'node-cron';
import Product from '../models/Product.js';
import Position from '../models/Position.js';
import Transaction from '../models/Transaction.js';
import Commission from '../models/Commission.js';
import KLine from '../models/KLine.js';
import User from '../models/User.js';
import moment from 'moment';

// 聚合K线数据
const aggregateKLineData = async () => {
  try {
    console.log('开始聚合K线数据...');
    
    const products = await Product.find({ status: 'active' });
    
    for (const product of products) {
      // 获取最新的日K线数据
      const today = moment().startOf('day').toDate();
      const dayKLines = await KLine.find({
        product: product._id,
        period: 'day'
      }).sort({ timestamp: 1 });
      
      // 聚合周K线
      const weekStart = moment().startOf('week').toDate();
      const weekKLines = dayKLines.filter(k => k.timestamp >= weekStart);
      
      if (weekKLines.length > 0) {
        const weekOpen = weekKLines[0].open;
        const weekClose = weekKLines[weekKLines.length - 1].close;
        const weekHigh = Math.max(...weekKLines.map(k => k.high));
        const weekLow = Math.min(...weekKLines.map(k => k.low));
        const weekVolume = weekKLines.reduce((sum, k) => sum + k.volume, 0);
        const weekAmount = weekKLines.reduce((sum, k) => sum + k.amount, 0);
        
        let weekKLine = await KLine.findOne({
          product: product._id,
          period: 'week',
          timestamp: weekStart
        });
        
        if (weekKLine) {
          weekKLine.open = weekOpen;
          weekKLine.close = weekClose;
          weekKLine.high = weekHigh;
          weekKLine.low = weekLow;
          weekKLine.volume = weekVolume;
          weekKLine.amount = weekAmount;
          await weekKLine.save();
        } else {
          weekKLine = new KLine({
            product: product._id,
            period: 'week',
            timestamp: weekStart,
            open: weekOpen,
            close: weekClose,
            high: weekHigh,
            low: weekLow,
            volume: weekVolume,
            amount: weekAmount
          });
          await weekKLine.save();
        }
      }
      
      // 聚合月K线
      const monthStart = moment().startOf('month').toDate();
      const monthKLines = dayKLines.filter(k => k.timestamp >= monthStart);
      
      if (monthKLines.length > 0) {
        const monthOpen = monthKLines[0].open;
        const monthClose = monthKLines[monthKLines.length - 1].close;
        const monthHigh = Math.max(...monthKLines.map(k => k.high));
        const monthLow = Math.min(...monthKLines.map(k => k.low));
        const monthVolume = monthKLines.reduce((sum, k) => sum + k.volume, 0);
        const monthAmount = monthKLines.reduce((sum, k) => sum + k.amount, 0);
        
        let monthKLine = await KLine.findOne({
          product: product._id,
          period: 'month',
          timestamp: monthStart
        });
        
        if (monthKLine) {
          monthKLine.open = monthOpen;
          monthKLine.close = monthClose;
          monthKLine.high = monthHigh;
          monthKLine.low = monthLow;
          monthKLine.volume = monthVolume;
          monthKLine.amount = monthAmount;
          await monthKLine.save();
        } else {
          monthKLine = new KLine({
            product: product._id,
            period: 'month',
            timestamp: monthStart,
            open: monthOpen,
            close: monthClose,
            high: monthHigh,
            low: monthLow,
            volume: monthVolume,
            amount: monthAmount
          });
          await monthKLine.save();
        }
      }
      
      // 聚合年K线
      const yearStart = moment().startOf('year').toDate();
      const yearKLines = dayKLines.filter(k => k.timestamp >= yearStart);
      
      if (yearKLines.length > 0) {
        const yearOpen = yearKLines[0].open;
        const yearClose = yearKLines[yearKLines.length - 1].close;
        const yearHigh = Math.max(...yearKLines.map(k => k.high));
        const yearLow = Math.min(...yearKLines.map(k => k.low));
        const yearVolume = yearKLines.reduce((sum, k) => sum + k.volume, 0);
        const yearAmount = yearKLines.reduce((sum, k) => sum + k.amount, 0);
        
        let yearKLine = await KLine.findOne({
          product: product._id,
          period: 'year',
          timestamp: yearStart
        });
        
        if (yearKLine) {
          yearKLine.open = yearOpen;
          yearKLine.close = yearClose;
          yearKLine.high = yearHigh;
          yearKLine.low = yearLow;
          yearKLine.volume = yearVolume;
          yearKLine.amount = yearAmount;
          await yearKLine.save();
        } else {
          yearKLine = new KLine({
            product: product._id,
            period: 'year',
            timestamp: yearStart,
            open: yearOpen,
            close: yearClose,
            high: yearHigh,
            low: yearLow,
            volume: yearVolume,
            amount: yearAmount
          });
          await yearKLine.save();
        }
      }
      
      // 更新产品的周、月、年涨跌幅
      const prevWeekClose = dayKLines.length > 7 ? dayKLines[dayKLines.length - 8].close : dayKLines[0].open;
      const prevMonthClose = dayKLines.length > 30 ? dayKLines[dayKLines.length - 31].close : dayKLines[0].open;
      const prevYearClose = dayKLines.length > 365 ? dayKLines[dayKLines.length - 366].close : dayKLines[0].open;
      
      product.priceChanges.weekly = (weekKLines.length > 0) ? 
        (weekKLines[weekKLines.length - 1].close - prevWeekClose) / prevWeekClose : 0;
      product.priceChanges.monthly = (monthKLines.length > 0) ? 
        (monthKLines[monthKLines.length - 1].close - prevMonthClose) / prevMonthClose : 0;
      product.priceChanges.yearly = (yearKLines.length > 0) ? 
        (yearKLines[yearKLines.length - 1].close - prevYearClose) / prevYearClose : 0;
      
      // 重置每日成交量
      product.dailyVolume = 0;
      
      await product.save();
    }
    
    console.log('K线数据聚合完成');
  } catch (error) {
    console.error('聚合K线数据错误:', error);
  }
};

// 更新用户持仓收益
const updatePositionProfit = async () => {
  try {
    console.log('开始更新用户持仓收益...');
    
    const positions = await Position.find({ status: 'open' });
    
    for (const position of positions) {
      const product = await Product.findById(position.product);
      if (!product) continue;
      
      // 更新当前价格
      position.currentPrice = product.currentPrice;
      
      // 计算收益
      const marketValue = position.quantity * position.currentPrice;
      const profit = marketValue - position.totalCost;
      const profitPercent = (profit / position.totalCost) * 100;
      
      position.profit = profit;
      position.profitPercent = profitPercent;
      position.lastUpdatedAt = new Date();
      
      // 检查止盈止损
      if (position.autoClose) {
        const stopProfitPrice = position.costPrice * (1 + product.stopProfit);
        const stopLossPrice = position.costPrice * (1 - product.stopLoss);
        
        if (product.stopProfit > 0 && position.currentPrice >= stopProfitPrice) {
          // 达到止盈，自动平仓
          await closePosition(position, product, 'stop_profit');
        } else if (product.stopLoss > 0 && position.currentPrice <= stopLossPrice) {
          // 达到止损，自动平仓
          await closePosition(position, product, 'stop_loss');
        }
      }
      
      await position.save();
    }
    
    console.log('用户持仓收益更新完成');
  } catch (error) {
    console.error('更新用户持仓收益错误:', error);
  }
};

// 平仓
const closePosition = async (position, product, reason) => {
  try {
    // 计算卖出金额和手续费
    const sellAmount = position.quantity * position.currentPrice;
    const fee = sellAmount * product.feeRate;
    const actualAmount = sellAmount - fee;
    
    // 创建卖出订单
    const Order = (await import('../models/Order.js')).default;
    const order = new Order({
      orderNo: moment().format('YYYYMMDDHHmmss') + Math.random().toString(36).substring(2, 8).toUpperCase(),
      user: position.user,
      product: position.product,
      type: 'sell',
      quantity: position.quantity,
      price: position.currentPrice,
      amount: sellAmount,
      fee,
      actualAmount,
      status: 'completed',
      source: 'settlement',
      reason,
      positionId: position._id
    });
    
    await order.save();
    
    // 返还给用户
    const user = await User.findById(position.user);
    user.balance += actualAmount;
    await user.save();
    
    // 创建交易记录
    await Transaction.create({
      user: user._id,
      type: reason === 'stop_profit' ? 'profit' : 'loss',
      amount: actualAmount,
      balanceAfter: user.balance,
      orderId: order._id,
      productId: position.product,
      description: `${reason === 'stop_profit' ? '止盈' : '止损'}平仓 ${product.name} ${position.quantity}个`
    });
    
    // 更新持仓状态
    position.status = reason === 'stop_profit' ? 'closed' : 'forced_closed';
    position.quantity = 0;
    await position.save();
    
    console.log(`用户 ${user.username} 的 ${product.name} 持仓已${reason === 'stop_profit' ? '止盈' : '止损'}平仓`);
  } catch (error) {
    console.error('平仓错误:', error);
  }
};

// 发放返佣
const distributeCommission = async () => {
  try {
    console.log('开始发放返佣...');
    
    // 查找所有待发放的返佣记录
    const pendingCommissions = await Commission.find({ status: 'calculated' });
    
    for (const commission of pendingCommissions) {
      const inviter = await User.findById(commission.inviter);
      if (!inviter) continue;
      
      // 将返佣金额加入用户余额
      inviter.balance += commission.amount;
      await inviter.save();
      
      // 更新返佣记录状态
      commission.status = 'paid';
      commission.paidAt = new Date();
      await commission.save();
      
      // 创建交易记录
      await Transaction.create({
        user: inviter._id,
        type: 'commission',
        amount: commission.amount,
        balanceAfter: inviter.balance,
        description: `返佣收益 - ${commission.type === 'direct' ? '直推' : '间推'}`,
        remark: `订单号: ${(await import('../models/Order.js')).default.findById(commission.orderId).orderNo}`
      });
    }
    
    console.log(`已发放 ${pendingCommissions.length} 条返佣记录`);
  } catch (error) {
    console.error('发放返佣错误:', error);
  }
};

// 每日结算主函数
const dailySettlement = async () => {
  try {
    console.log('开始每日结算...');
    console.log(`结算时间: ${new Date().toISOString()}`);
    
    // 1. 聚合K线数据
    await aggregateKLineData();
    
    // 2. 更新用户持仓收益
    await updatePositionProfit();
    
    // 3. 发放返佣
    await distributeCommission();
    
    console.log('每日结算完成');
  } catch (error) {
    console.error('每日结算错误:', error);
  }
};

// 启动每日结算任务（每天凌晨0点执行）
export const startDailySettlement = () => {
  cron.schedule('0 0 * * *', dailySettlement, {
    timezone: 'Asia/Shanghai'
  });
  
  console.log('每日结算任务已配置，将在每天凌晨0点执行');
};

// 手动执行结算（用于测试）
export const manualSettlement = async (req, res) => {
  try {
    await dailySettlement();
    res.json({ message: '手动结算执行成功' });
  } catch (error) {
    res.status(500).json({ error: '手动结算执行失败', message: error.message });
  }
};

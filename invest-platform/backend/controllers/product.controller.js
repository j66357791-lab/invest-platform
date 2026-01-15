import Product from '../models/Product.js';
import KLine from '../models/KLine.js';
import Position from '../models/Position.js';
import moment from 'moment';

// 获取道具列表
export const getProducts = async (req, res) => {
  try {
    const { 
      category, 
      status = 'active',
      sort = 'popularity',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // 构建查询条件
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    
    // 构建排序
    let sortOption = {};
    sortOption[sort] = order === 'desc' ? -1 : 1;
    
    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询道具
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username')
      .populate('lastUpdatedBy', 'username');
    
    // 查询总数
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取道具列表错误:', error);
    res.status(500).json({ error: '获取道具列表失败', message: error.message });
  }
};

// 获取道具详情
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id)
      .populate('createdBy', 'username')
      .populate('lastUpdatedBy', 'username');
    
    if (!product) {
      return res.status(404).json({ error: '道具不存在' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('获取道具详情错误:', error);
    res.status(500).json({ error: '获取道具详情失败', message: error.message });
  }
};

// 获取道具K线数据
export const getKLineData = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'day', limit = 100 } = req.query;
    
    // 验证period参数
    const validPeriods = ['day', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: '无效的周期参数' });
    }
    
    // 查询K线数据
    const kLineData = await KLine.find({
      product: id,
      period
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean();
    
    // 反转数组，按时间升序排列
    res.json(kLineData.reverse());
  } catch (error) {
    console.error('获取K线数据错误:', error);
    res.status(500).json({ error: '获取K线数据失败', message: error.message });
  }
};

// 获取排行榜
export const getRankings = async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    let sortOption = {};
    switch (type) {
      case 'popularity':
        sortOption = { popularity: -1 };
        break;
      case 'daily':
        sortOption = { 'priceChanges.daily': -1 };
        break;
      case 'weekly':
        sortOption = { 'priceChanges.weekly': -1 };
        break;
      case 'monthly':
        sortOption = { 'priceChanges.monthly': -1 };
        break;
      case 'yearly':
        sortOption = { 'priceChanges.yearly': -1 };
        break;
      default:
        return res.status(400).json({ error: '无效的排行榜类型' });
    }
    
    const rankings = await Product.find({ status: 'active' })
      .sort(sortOption)
      .limit(parseInt(limit))
      .select('name code currentPrice priceChanges popularity category images');
    
    res.json(rankings);
  } catch (error) {
    console.error('获取排行榜错误:', error);
    res.status(500).json({ error: '获取排行榜失败', message: error.message });
  }
};

export default {
  getProducts,
  getProduct,
  getKLineData,
  getRankings
};

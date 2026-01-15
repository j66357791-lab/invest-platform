import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// 用户注册
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, email, password, inviteCode } = req.body;
    
    // 检查用户是否存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }
    
    // 查找邀请人
    let inviter = null;
    if (inviteCode) {
      inviter = await User.findOne({ inviteCode });
    }
    
    // 创建用户
    const user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      inviterId: inviter ? inviter._id : null
    });
    
    await user.save();
    
    // 如果有邀请人，更新邀请人的邀请列表
    if (inviter) {
      await inviter.addInvitedUser(user._id);
    }
    
    // 生成令牌
    const token = generateToken(user._id);
    
    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        inviteCode: user.inviteCode
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败', message: error.message });
  }
};

// 用户登录
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 检查密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 检查账户状态
    if (user.status !== 'active') {
      return res.status(403).json({ error: '账户已被禁用' });
    }
    
    // 更新最后登录信息
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip || req.connection.remoteAddress;
    await user.save();
    
    // 生成令牌
    const token = generateToken(user._id);
    
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        inviteCode: user.inviteCode,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败', message: error.message });
  }
};

// 获取用户信息
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('invitedUsers', 'username email balance')
      .populate('inviterId', 'username email');
    
    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败', message: error.message });
  }
};

// 提交实名认证
export const submitVerification = async (req, res) => {
  try {
    const { realName, idCard, idCardFront, idCardBack } = req.body;
    
    // 检查是否已经认证
    const user = await User.findById(req.user._id);
    if (user.verificationStatus === 'verified') {
      return res.status(400).json({ error: '已经完成实名认证' });
    }
    
    // 更新用户实名信息
    user.realName = realName;
    user.idCard = idCard;
    user.idCardFront = idCardFront;
    user.idCardBack = idCardBack;
    user.verificationStatus = 'pending';
    
    await user.save();
    
    // 记录管理员日志
    await AdminLog.create({
      admin: req.user._id,
      module: 'verification',
      action: 'submit_verification',
      details: {
        userId: user._id,
        username: user.username
      },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({ message: '实名认证已提交，等待审核' });
  } catch (error) {
    console.error('提交实名认证错误:', error);
    res.status(500).json({ error: '提交实名认证失败', message: error.message });
  }
};

export default {
  register,
  login,
  getProfile,
  submitVerification
};

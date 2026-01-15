// utils/initAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const initDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('数据库连接成功，开始检查管理员...');

    const adminPhone = process.env.ADMIN_PHONE;
    const adminPass = process.env.ADMIN_PASS;

    // 检查是否已存在该手机号
    const existingUser = await User.findOne({ phone: adminPhone });

    if (existingUser) {
      console.log(`管理员 ${adminPhone} 已存在，无需重复创建。`);
    } else {
      // 创建超级管理员
      await User.create({
        phone: adminPhone,
        password: adminPass,
        username: '超级管理员',
        role: 'super_admin',
        balance: 999999999, // 测试用，给管理员无限钱(模拟)
        inviteCode: 'ADMIN001'
      });
      console.log(`✅ 超级管理员创建成功！`);
      console.log(`账号: ${adminPhone}`);
      console.log(`密码: ${adminPass}`);
    }

    process.exit();
  } catch (error) {
    console.error('初始化出错:', error);
    process.exit(1);
  }
};

initDB();

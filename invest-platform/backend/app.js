// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 测试接口
app.get('/', (req, res) => {
  res.send('投资人平台 API 正在运行...');
});

const PORT = process.env.PORT || 3000;

// ⚠️ 关键修改：添加 '0.0.0.0' 绑定
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

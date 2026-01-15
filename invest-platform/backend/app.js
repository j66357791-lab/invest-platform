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
app.use(cors()); // 允许前端跨域访问
app.use(express.json()); // 解析 JSON 请求体

// 测试接口
app.get('/', (req, res) => {
  res.send('投资人平台 API 正在运行...');
});

// 路由挂载 (后续会添加)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

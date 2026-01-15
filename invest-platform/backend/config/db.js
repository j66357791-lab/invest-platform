import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`数据库连接错误: ${error.message}`);
    throw error;
  }
};

// 数据库连接事件监听
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB 连接断开');
});

mongoose.connection.on('error', (error) => {
  console.error(`MongoDB 连接错误: ${error}`);
});

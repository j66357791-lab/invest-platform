import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/user';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isRegister) {
        const response = await userApi.register(values);
        message.success('注册成功');
        setIsRegister(false);
      } else {
        const response = await userApi.login(values);
        login(response.user, response.token);
        toast.success('登录成功');
        navigate('/');
      }
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title={isRegister ? '注册' : '登录'}>
        <Form
          name="login-form"
          onFinish={onFinish}
          autoComplete="off"
        >
          {isRegister && (
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                size="large"
              />
            </Form.Item>
          )}
          
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="邮箱"
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          {isRegister && (
            <Form.Item
              name="inviteCode"
              initialValue=""
            >
              <Input
                placeholder="邀请码（可选）"
                size="large"
              />
            </Form.Item>
          )}
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              {isRegister ? '注册' : '登录'}
            </Button>
          </Form.Item>
          
          <div className="toggle-form">
            <Button type="link" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;

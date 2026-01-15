import React, { useState } from 'react';
import { login, register } from '../api';

export default function Login({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await login({ phone, password });
      } else {
        const res = await register({ phone, password, inviteCode });
      }
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };
  
  return (
    <div className="page login-page">
      <div className="login-container">
        <h1>{isLogin ? '登录' : '注册'}</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="tel"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {!isLogin && (
            <div className="input-group">
              <input
                type="text"
                placeholder="邀请码（选填）"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
          )}
          <button type="submit" className="submit-btn">{isLogin ? '登录' : '注册'}</button>
        </form>
        <div className="switch-mode">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? '立即注册' : '立即登录'}
          </span>
        </div>
      </div>
    </div>
  );
}

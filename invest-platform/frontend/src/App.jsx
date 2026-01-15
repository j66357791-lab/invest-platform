import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Market from './pages/Market';
import ProductDetail from './pages/ProductDetail';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Admin from './pages/Admin';

// 底部导航栏组件
function BottomNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  
  if (location.pathname === '/login' || location.pathname.startsWith('/admin')) return null;
  
  return (
    <nav className="bottom-nav">
      <Link to="/" className={isActive('/') ? 'active' : ''}>
        <span>🏠</span>首页
      </Link>
      <Link to="/market" className={isActive('/market') ? 'active' : ''}>
        <span>📊</span>市场
      </Link>
      <Link to="/wallet" className={isActive('/wallet') ? 'active' : ''}>
        <span>💰</span>钱包
      </Link>
      <Link to="/profile" className={isActive('/profile') ? 'active' : ''}>
        <span>👤</span>我的
      </Link>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);
  
  if (loading) return <div>加载中...</div>;
  
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/" element={<Home user={user} />} />
          <Route path="/market" element={<Market />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;

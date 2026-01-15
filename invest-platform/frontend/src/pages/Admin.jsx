import React, { useState, useEffect } from 'react';
import { 
  adminGetProducts, 
  adminCreateProduct, 
  adminUpdatePrice,
  adminGetAllWithdraws,
  adminAuditWithdraw
} from '../api';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  
  useEffect(() => {
    loadProducts();
    loadWithdraws();
  }, []);
  
  const loadProducts = async () => {
    const res = await adminGetProducts();
    setProducts(res.data);
  };
  
  const loadWithdraws = async () => {
    // const res = await adminGetAllWithdraws();
    // setWithdraws(res.data);
  };
  
  // 上架道具
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    await adminCreateProduct(data);
    alert('上架成功');
    loadProducts();
  };
  
  // 更新价格
  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    await adminUpdatePrice(data);
    alert('价格更新成功');
    loadProducts();
  };
  
  return (
    <div className="page admin-page">
      <h1>管理后台</h1>
      
      <div className="admin-tabs">
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
          道具管理
        </button>
        <button className={activeTab === 'price' ? 'active' : ''} onClick={() => setActiveTab('price')}>
          价格更新
        </button>
        <button className={activeTab === 'withdraw' ? 'active' : ''} onClick={() => setActiveTab('withdraw')}>
          提现审核
        </button>
      </div>
      
      {activeTab === 'products' && (
        <div className="admin-section">
          <h2>道具列表</h2>
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>当前价格</th>
                <th>日涨跌</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>¥{p.currentPrice.toFixed(2)}</td>
                  <td style={{ color: p.changeDay >= 0 ? '#ff4d4f' : '#52c41a' }}>
                    {p.changeDay}%
                  </td>
                  <td>{p.status === 'active' ? '上架' : '下架'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <h2>上架新道具</h2>
          <form onSubmit={handleCreateProduct} className="admin-form">
            <input name="name" placeholder="道具名称" required />
            <input name="symbol" placeholder="代码（如GOLD_SWORD）" required />
            <select name="category">
              <option value="game">游戏板块</option>
              <option value="virtual">虚拟板块</option>
              <option value="physical">实物板块</option>
            </select>
            <input name="currentPrice" type="number" placeholder="当前价格" required />
            <input name="issuePrice" type="number" placeholder="发行价" required />
            <input name="feeRate" type="number" step="0.001" placeholder="手续费率（如0.01为1%）" />
            <input name="minUnit" type="number" placeholder="最小交易单位" />
            <input name="stopProfitRate" type="number" placeholder="止盈比例（%）" />
            <input name="stopLossRate" type="number" placeholder="止损比例（%）" />
            <input name="withdrawLockDays" type="number" placeholder="提现锁定天数" />
            <textarea name="notes" placeholder="注意事项" />
            <button type="submit">上架</button>
          </form>
        </div>
      )}
      
      {activeTab === 'price' && (
        <div className="admin-section">
          <h2>更新每日价格</h2>
          <form onSubmit={handleUpdatePrice} className="admin-form">
            <select name="productId" required>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            <input name="open" type="number" placeholder="开盘价" required />
            <input name="high" type="number" placeholder="最高价" required />
            <input name="low" type="number" placeholder="最低价" required />
            <input name="close" type="number" placeholder="收盘价" required />
            <h3>涨跌幅基准价</h3>
            <input name="dayOpen" type="number" placeholder="日开盘基准" />
            <input name="weekOpen" type="number" placeholder="周开盘基准" />
            <input name="monthOpen" type="number" placeholder="月开盘基准" />
            <input name="yearOpen" type="number" placeholder="年开盘基准" />
            <button type="submit">更新价格</button>
          </form>
        </div>
      )}
      
      {activeTab === 'withdraw' && (
        <div className="admin-section">
          <h2>提现审核</h2>
          <table>
            <thead>
              <tr>
                <th>申请号</th>
                <th>用户</th>
                <th>金额</th>
                <th>银行卡</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {withdraws.map(w => (
                <tr key={w._id}>
                  <td>{w.withdrawNo}</td>
                  <td>{w.userId}</td>
                  <td>¥{w.amount}</td>
                  <td>{w.bankCard}</td>
                  <td>{w.status}</td>
                  <td>
                    {w.status === 'pending' && (
                      <>
                        <button onClick={() => adminAuditWithdraw(w._id, { status: 'approved' })}>
                          通过
                        </button>
                        <button onClick={() => adminAuditWithdraw(w._id, { status: 'rejected' })}>
                          拒绝
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

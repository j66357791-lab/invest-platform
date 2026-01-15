import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductDetail, buyProduct, sellProduct, getHoldings } from '../api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [amount, setAmount] = useState(1);
  
  useEffect(() => {
    loadProduct();
    loadHoldings();
  }, [id]);
  
  const loadProduct = async () => {
    const res = await getProductDetail(id);
    setProduct(res.data);
  };
  
  const loadHoldings = async () => {
    const res = await getHoldings();
    setHoldings(res.data);
  };
  
  const handleBuy = async () => {
    try {
      await buyProduct({ productId: id, amount: Number(amount) });
      alert('购买成功！');
      setShowBuyModal(false);
      loadHoldings();
    } catch (err) {
      alert(err.response?.data?.error || '购买失败');
    }
  };
  
  const myHolding = holdings.find(h => h.productId === id);
  
  if (!product) return <div>加载中...</div>;
  
  const getChangeColor = (value) => value >= 0 ? '#ff4d4f' : '#52c41a';
  
  return (
    <div className="page product-detail-page">
      <button onClick={() => navigate(-1)} className="back-btn">← 返回</button>
      
      {/* 价格信息 */}
      <div className="price-header">
        <div className="current-price">¥{product.currentPrice.toFixed(2)}</div>
        <div className="change" style={{ color: getChangeColor(product.changeDay) }}>
          日涨跌: {product.changeDay >= 0 ? '+' : ''}{product.changeDay}%
        </div>
      </div>
      
      {/* 涨跌幅详情 */}
      <div className="change-detail">
        <div>
          <span>日: <span style={{ color: getChangeColor(product.changeDay) }}>{product.changeDay}%</span></span>
          <span>周: <span style={{ color: getChangeColor(product.changeWeek) }}>{product.changeWeek}%</span></span>
        </div>
        <div>
          <span>月: <span style={{ color: getChangeColor(product.changeMonth) }}>{product.changeMonth}%</span></span>
          <span>年: <span style={{ color: getChangeColor(product.changeYear) }}>{product.changeYear}%</span></span>
        </div>
      </div>
      
      {/* K线图 */}
      <div className="kline-chart">
        <h3>价格走势</h3>
        {/* 这里使用 ECharts 或 Recharts 绘制K线图 */}
        <div style={{ height: 300, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          K线图组件
        </div>
      </div>
      
      {/* 产品信息 */}
      <div className="product-info">
        <h3>产品信息</h3>
        <p><strong>名称:</strong> {product.name}</p>
        <p><strong>分类:</strong> {product.category}</p>
        <p><strong>手续费:</strong> {(product.feeRate * 100).toFixed(1)}%</p>
        <p><strong>最小单位:</strong> {product.minUnit}</p>
        {product.notes && <p><strong>注意事项:</strong> {product.notes}</p>}
      </div>
      
      {/* 我的持仓 */}
      {myHolding && (
        <div className="my-holding">
          <h3>我的持仓</h3>
          <div className="holding-info">
            <div>持仓: {myHolding.amount}个</div>
            <div>成本: ¥{myHolding.costPrice.toFixed(2)}</div>
            <div>收益: <span style={{ color: getChangeColor(myHolding.profit) }}>
              ¥{myHolding.profit.toFixed(2)} ({myHolding.profitRate}%)
            </span></div>
          </div>
        </div>
      )}
      
      {/* 操作按钮 */}
      <div className="action-buttons">
        <button 
          className="buy-btn"
          onClick={() => setShowBuyModal(true)}
        >
          买入
        </button>
        {myHolding && myHolding.amount > 0 && (
          <button className="sell-btn" onClick={() => {/* TODO: 卖出逻辑 */}}>
            卖出
          </button>
        )}
      </div>
      
      {/* 购买弹窗 */}
      {showBuyModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>购买 {product.name}</h3>
            <p>当前价格: ¥{product.currentPrice.toFixed(2)}</p>
            <p>手续费: {(product.feeRate * 100).toFixed(1)}%</p>
            <div className="input-group">
              <label>数量:</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={product.minUnit}
              />
            </div>
            <p>总金额: ¥{(amount * product.currentPrice * (1 + product.feeRate)).toFixed(2)}</p>
            <div className="modal-buttons">
              <button onClick={() => setShowBuyModal(false)}>取消</button>
              <button className="confirm" onClick={handleBuy}>确认购买</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getProducts } from '../api';
import { Link } from 'react-router-dom';

export default function Market() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('changeDay'); // changeDay, changeWeek, changeMonth, changeYear
  
  useEffect(() => {
    loadProducts();
  }, [category]);
  
  const loadProducts = async () => {
    const res = await getProducts(category === 'all' ? {} : { category });
    let data = res.data;
    
    // 排序
    data = data.sort((a, b) => b[sortBy] - a[sortBy]);
    setProducts(data);
  };
  
  const getChangeColor = (value) => {
    return value >= 0 ? '#ff4d4f' : '#52c41a';
  };
  
  return (
    <div className="page market-page">
      <div className="header">
        <h1>市场行情</h1>
      </div>
      
      {/* 分类Tab */}
      <div className="category-tabs">
        {['all', 'game', 'virtual', 'physical'].map(cat => (
          <button
            key={cat}
            className={category === cat ? 'active' : ''}
            onClick={() => setCategory(cat)}
          >
            {cat === 'all' ? '全部' : cat === 'game' ? '游戏' : cat === 'virtual' ? '虚拟' : '实物'}
          </button>
        ))}
      </div>
      
      {/* 排序 */}
      <div className="sort-tabs">
        {[
          { key: 'changeDay', label: '日' },
          { key: 'changeWeek', label: '周' },
          { key: 'changeMonth', label: '月' },
          { key: 'changeYear', label: '年' }
        ].map(item => (
          <button
            key={item.key}
            className={sortBy === item.key ? 'active' : ''}
            onClick={() => setSortBy(item.key)}
          >
            {item.label}%
          </button>
        ))}
      </div>
      
      {/* 道具列表 - 基金样式 */}
      <div className="product-list">
        {products.map(product => (
          <Link key={product._id} to={`/product/${product._id}`} className="product-item fund-style">
            <div className="product-icon">
              <img src={product.icon || '/default-icon.png'} alt={product.name} />
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-symbol">{product.symbol}</div>
            </div>
            <div className="product-price">
              <div className="current-price">
                ¥{product.currentPrice.toFixed(2)}
              </div>
              <div className="change" style={{ color: getChangeColor(product[sortBy]) }}>
                {product[sortBy] >= 0 ? '+' : ''}{product[sortBy]}%
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getWallet, deposit, withdraw, getTransactions } from '../api';

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  
  useEffect(() => {
    loadWallet();
    loadTransactions();
  }, []);
  
  const loadWallet = async () => {
    const res = await getWallet();
    setWallet(res.data);
  };
  
  const loadTransactions = async () => {
    const res = await getTransactions({ limit: 20 });
    setTransactions(res.data.transactions);
  };
  
  const handleDeposit = async () => {
    try {
      await deposit({ amount: Number(amount) });
      alert('充值申请已提交，请联系管理员审核');
      setShowDepositModal(false);
    } catch (err) {
      alert(err.response?.data?.error || '充值失败');
    }
  };
  
  const handleWithdraw = async () => {
    try {
      await withdraw({ 
        amount: Number(amount),
        bankName: '工商银行', // 实际应从表单获取
        bankCard: '123456789',
        accountName: '张三'
      });
      alert('提现申请已提交');
      setShowWithdrawModal(false);
      loadWallet();
    } catch (err) {
      alert(err.response?.data?.error || '提现失败');
    }
  };
  
  const getTypeText = (type) => {
    const map = {
      deposit: '充值',
      withdraw: '提现',
      buy: '买入',
      sell: '卖出',
      profit: '收益',
      commission: '返佣',
      fee: '手续费'
    };
    return map[type] || type;
  };
  
  if (!wallet) return <div>加载中...</div>;
  
  return (
    <div className="page wallet-page">
      <div className="header">
        <h1>我的钱包</h1>
      </div>
      
      {/* 余额卡片 */}
      <div className="balance-card">
        <div className="balance-label">可用余额</div>
        <div className="balance-amount">¥{wallet.balance.toFixed(2)}</div>
        {wallet.frozen > 0 && (
          <div className="frozen-amount">冻结: ¥{wallet.frozen.toFixed(2)}</div>
        )}
        {wallet.todayProfit !== undefined && (
          <div className="today-profit">
            今日收益: <span style={{ color: wallet.todayProfit >= 0 ? '#ff4d4f' : '#52c41a' }}>
              ¥{wallet.todayProfit.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      {/* 操作按钮 */}
      <div className="action-buttons">
        <button onClick={() => setShowDepositModal(true)}>充值</button>
        <button onClick={() => setShowWithdrawModal(true)}>提现</button>
      </div>
      
      {/* 交易明细 */}
      <div className="transactions">
        <h3>交易明细</h3>
        {transactions.map(tx => (
          <div key={tx._id} className="transaction-item">
            <div>
              <div className="tx-type">{getTypeText(tx.type)}</div>
              <div className="tx-date">{new Date(tx.createdAt).toLocaleString()}</div>
            </div>
            <div className={tx.amount >= 0 ? 'tx-amount positive' : 'tx-amount negative'}>
              {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      {/* 充值弹窗 */}
      {showDepositModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>充值</h3>
            <div className="input-group">
              <label>金额:</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <p className="deposit-info">请转账后提交申请，管理员审核后到账</p>
            <div className="modal-buttons">
              <button onClick={() => setShowDepositModal(false)}>取消</button>
              <button className="confirm" onClick={handleDeposit}>提交</button>
            </div>
          </div>
        </div>
      )}
      
      {/* 提现弹窗 */}
      {showWithdrawModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>提现</h3>
            <div className="input-group">
              <label>金额:</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} max={wallet.balance} />
            </div>
            <p className="withdraw-info">可用余额: ¥{wallet.balance.toFixed(2)}</p>
            <div className="modal-buttons">
              <button onClick={() => setShowWithdrawModal(false)}>取消</button>
              <button className="confirm" onClick={handleWithdraw}>提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

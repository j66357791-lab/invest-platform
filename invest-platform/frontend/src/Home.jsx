import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query';
import { productApi } from '../api/product';
import { orderApi } from '../api/order';
import { walletApi } from '../api/wallet';
import { useAuthStore } from '../store/authStore';
import './Home.css';

const Home = () => {
  const { user } = useAuthStore();

  // 获取热门产品
  const { data: popularProducts } = useQuery(
    'popularProducts',
    () => productApi.getRankings({ type: 'popularity', limit: 5 }),
    { refetchInterval: 60000 }
  );

  // 获取用户持仓
  const { data: positions } = useQuery('userPositions', orderApi.getPositiones);

  // 获取收益统计
  const { data: profitStats } = useQuery(
    'profitStats',
    () => walletApi.getProfitStats({ period: 'daily' }),
    { refetchInterval: 60000 }
  );

  const popularColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      render: (_, record, index) => index + 1,
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '当前价格',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (value) => value.toFixed(2),
    },
    {
      title: '日涨跌幅',
      dataIndex: ['priceChanges', 'daily'],
      key: 'dailyChange',
      render: (value) => (
        <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {value >= 0 ? '+' : ''}{(value * 100).toFixed(2)}%
        </span>
      ),
    },
  ];

  const positionColumns = [
    {
      title: '产品名称',
      dataIndex: ['product', 'name'],
      key: 'productName',
    },
    {
      title: '持仓数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (value) => value.toFixed(2),
    },
    {
      title: '当前价格',
      dataIndex: ['product', 'currentPrice'],
      key: 'currentPrice',
      render: (value) => value.toFixed(2),
    },
    {
      title: '收益',
      dataIndex: 'profit',
      key: 'profit',
      render: (value) => (
        <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}
        </span>
      ),
    },
    {
      title: '收益率',
      dataIndex: 'profitPercent',
      key: 'profitPercent',
      render: (value) => (
        <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
        </span>
      ),
    },
  ];

  return (
    <div className="home-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="账户余额"
              value={user?.balance || 0}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="日收益"
              value={profitStats?.totalNetProfit || 0}
              precision={2}
              valueStyle={{ color: (profitStats?.totalNetProfit || 0) >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={(profitStats?.totalNetProfit || 0) >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="持仓数量"
              value={positions?.length || 0}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="返佣余额"
              value={user?.commissionBalance || 0}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="人气排行榜">
            <Table
              dataSource={popularProducts?.products || []}
              columns={popularColumns}
              pagination={false}
              rowKey="_id"
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="我的持仓">
            <Table
              dataSource={positions || []}
              columns={positionColumns}
              pagination={false}
              rowKey="_id"
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;

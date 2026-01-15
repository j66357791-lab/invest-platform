import { useState } from 'react';
import { Card, Row, Col, Tag, Button, Space, Tabs, Table, Input, Select } from 'antd';
import { SearchOutlined, FireOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query';
import { productApi } from '../api/product';
import { useNavigate } from 'react-router-dom';
import './Market.css';

const { TabPane } = Tabs;
const { Option } = Select;

const Market = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [searchText, setSearchText] = useState('');

  // 获取产品列表
  const { data: productsData } = useQuery(
    ['products', category],
    () => productApi.getProducts({ category: category === 'all' ? undefined : category }),
    { refetchInterval: 60000 }
  );

  // 获取排行榜
  const { data: rankingsData } = useQuery(
    'rankings',
    () => productApi.getRankings({ type: 'daily', limit: 10 }),
    { refetchInterval: 60000 }
  );

  const categoryMap = {
    all: '全部',
    physical: '实物',
    virtual: '虚拟',
    game: '游戏',
  };

  const filteredProducts = productsData?.products?.filter(product =>
    product.name.toLowerCase().includes(searchText.toLowerCase()) ||
    product.code.toLowerCase().includes(searchText.toLowerCase())
  ) || [];

  const rankingsColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      render: (_, record, index) => (
        <Tag color={index < 3 ? 'gold' : 'default'}>
          {index + 1}
        </Tag>
      ),
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
        <Tag color={value >= 0 ? 'green' : 'red'}>
          {value >= 0 ? <RiseOutlined /> : <FallOutlined />}
          {Math.abs(value * 100).toFixed(2)}%
        </Tag>
      ),
    },
    {
      title: '人气',
      dataIndex: 'popularity',
      key: 'popularity',
      render: (value) => (
        <Space>
          <FireOutlined />
          {value}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => navigate(`/market/${record._id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="market-container">
      <Card title="市场行情">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 搜索和筛选 */}
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Input
                placeholder="搜索产品名称或代码"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col>
              <Select
                style={{ width: 120 }}
                value={category}
                onChange={setCategory}
              >
                <Option value="all">全部</Option>
                <Option value="physical">实物</Option>
                <Option value="virtual">虚拟</Option>
                <Option value="game">游戏</Option>
              </Select>
            </Col>
          </Row>

          {/* 板块分类 */}
          <Tabs
            activeKey={category}
            onChange={setCategory}
            type="card"
          >
            <TabPane tab="全部" key="all" />
            <TabPane tab="实物" key="physical" />
            <TabPane tab="虚拟" key="virtual" />
            <TabPane tab="游戏" key="game" />
          </Tabs>

          {/* 产品列表 */}
          <Row gutter={[16, 16]}>
            {filteredProducts.map((product) => (
              <Col xs={24} sm={12} md={8} lg={6} key={product._id}>
                <Card
                  hoverable
                  className="product-card"
                  onClick={() => navigate(`/market/${product._id}`)}
                >
                  <div className="product-image">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="no-image">暂无图片</div>
                    )}
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-code">{product.code}</p>
                  <div className="product-price">
                    <span className="price">{product.currentPrice.toFixed(2)}</span>
                    <Tag
                      color={product.priceChanges.daily >= 0 ? 'green' : 'red'}
                      className="change-tag"
                    >
                      {product.priceChanges.daily >= 0 ? '+' : ''}
                      {(product.priceChanges.daily * 100).toFixed(2)}%
                    </Tag>
                  </div>
                  <div className="product-meta">
                    <Tag>{categoryMap[product.category]}</Tag>
                    <Tag><FireOutlined /> {product.popularity}</Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      </Card>

      {/* 排行榜 */}
      <Card title="排行榜" style={{ marginTop: 24 }}>
        <Tabs>
          <TabPane tab="日涨幅" key="daily">
            <Table
              dataSource={rankingsData || []}
              columns={rankingsColumns}
              pagination={false}
              rowKey="_id"
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Market;

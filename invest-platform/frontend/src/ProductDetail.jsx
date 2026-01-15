import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Button, Space, Tabs, Form, InputNumber, Modal, message } from 'antd';
import { RiseOutlined, FallOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productApi } from '../api/product';
import { orderApi } from '../api/order';
import ReactECharts from 'echarts-for-react';
import './ProductDetail.css';

const { TabPane } = Tabs;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orderType, setOrderType] = useState('buy');

  // 获取产品详情
  const { data: product } = useQuery(
    ['product', id],
    () => productApi.getProduct(id),
    { refetchInterval: 60000 }
  );

  // 获取K线数据
  const { data: kLineData } = useQuery(
    ['kLine', id],
    () => productApi.getKLineData(id, { period: 'day', limit: 100 }),
    { refetchInterval: 60000 }
  );

  // 创建订单
  const createOrderMutation = useMutation(orderApi.createOrder, {
    onSuccess: (data) => {
      message.success('订单创建成功');
      setIsModalVisible(false);
      queryClient.invalidateQueries('userPositions');
      queryClient.invalidateQueries('profitStats');
    },
    onError: (error) => {
      message.error(error.response?.data?.error || '订单创建失败');
    },
  });

  const [form] = Form.useForm();

  const handleOrder = () => {
    form.validateFields().then((values) => {
      createOrderMutation.mutate({
        productId: id,
        type: orderType,
        quantity: values.quantity,
      });
    });
  };

  const getKLineOption = () => {
    if (!kLineData || kLineData.length === 0) return {};

    const dates = kLineData.map(item => item.timestamp);
    const values = kLineData.map(item => [
      item.open,
      item.close,
      item.low,
      item.high,
    ]);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      xAxis: {
        data: dates,
        axisLine: { lineStyle: { color: '#8392A5' } },
      },
      yAxis: {
        scale: true,
        axisLine: { lineStyle: { color: '#8392A5' } },
        splitLine: { show: true, lineStyle: { color: '#8392A5' } },
      },
      series: [
        {
          type: 'candlestick',
          data: values,
          itemStyle: {
            color: '#00da3c',
            color0: '#ec0000',
            borderColor: '#008F28',
            borderColor0: '#8A0000',
          },
        },
      ],
    };
  };

  if (!product) {
    return <div>加载中...</div>;
  }

  const priceChangeColor = product.priceChanges.daily >= 0 ? '#52c41a' : '#ff4d4f';
  const priceChangeIcon = product.priceChanges.daily >= 0 ? <RiseOutlined /> : <FallOutlined />;

  return (
    <div className="product-detail-container">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          {/* 产品信息 */}
          <Card>
            <Row gutter={[16, 16]} align="middle">
              <Col>
                <div className="product-image">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div className="no-image">暂无图片</div>
                  )}
                </div>
              </Col>
              <Col flex="auto">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <h1 className="product-name">{product.name}</h1>
                  <p className="product-code">{product.code}</p>
                  <Tag>{product.category === 'physical' ? '实物' : product.category === 'virtual' ? '虚拟' : '游戏'}</Tag>
                </Space>
              </Col>
              <Col>
                <div className="price-info">
                  <div className="current-price">{product.currentPrice.toFixed(2)}</div>
                  <div className="price-change" style={{ color: priceChangeColor }}>
                    {priceChangeIcon}
                    {product.priceChanges.daily >= 0 ? '+' : ''}
                    {(product.priceChanges.daily * 100).toFixed(2)}%
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* K线图 */}
          <Card title="价格走势" style={{ marginTop: 24 }}>
            <ReactECharts option={getKLineOption()} style={{ height: 400 }} />
          </Card>

          {/* 产品详情 */}
          <Card title="产品详情" style={{ marginTop: 24 }}>
            <Tabs>
              <TabPane tab="基本信息" key="info">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <p><strong>名称：</strong>{product.name}</p>
                    <p><strong>代码：</strong>{product.code}</p>
                    <p><strong>板块：</strong>{product.category === 'physical' ? '实物' : product.category === 'virtual' ? '虚拟' : '游戏'}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong>手续费率：</strong>{(product.feeRate * 100).toFixed(2)}%</p>
                    <p><strong>最小交易单位：</strong>{product.minUnit}</p>
                    <p><strong>止盈比例：</strong>{product.stopProfit * 100}%</p>
                    <p><strong>止损比例：</strong>{product.stopLoss * 100}%</p>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="产品描述" key="description">
                <p>{product.description}</p>
              </TabPane>
              <TabPane tab="注意事项" key="notices">
                <ul>
                  {product.notices?.map((notice, index) => (
                    <li key={index}>{notice}</li>
                  ))}
                </ul>
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          {/* 交易面板 */}
          <Card title="交易">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Row gutter={8}>
                <Col span={12}>
                  <Button
                    type={orderType === 'buy' ? 'primary' : 'default'}
                    block
                    size="large"
                    onClick={() => setOrderType('buy')}
                  >
                    买入
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type={orderType === 'sell' ? 'primary' : 'default'}
                    block
                    size="large"
                    onClick={() => setOrderType('sell')}
                  >
                    卖出
                  </Button>
                </Col>
              </Row>

              <Form form={form}>
                <Form.Item
                  name="quantity"
                  rules={[
                    { required: true, message: '请输入数量' },
                    { type: 'number', min: product.minUnit, message: `最小交易单位为${product.minUnit}` },
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={`数量（最小${product.minUnit}）`}
                    min={product.minUnit}
                    precision={0}
                    size="large"
                  />
                </Form.Item>
              </Form>

              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                block
                size="large"
                onClick={() => setIsModalVisible(true)}
              >
                确认{orderType === 'buy' ? '买入' : '卖出'}
              </Button>
            </Space>
          </Card>

          {/* 涨跌幅信息 */}
          <Card title="涨跌幅" style={{ marginTop: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="change-item">
                  <p>日涨跌幅</p>
                  <p style={{ color: product.priceChanges.daily >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {product.priceChanges.daily >= 0 ? '+' : ''}{(product.priceChanges.daily * 100).toFixed(2)}%
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className="change-item">
                  <p>周涨跌幅</p>
                  <p style={{ color: product.priceChanges.weekly >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {product.priceChanges.weekly >= 0 ? '+' : ''}{(product.priceChanges.weekly * 100).toFixed(2)}%
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className="change-item">
                  <p>月涨跌幅</p>
                  <p style={{ color: product.priceChanges.monthly >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {product.priceChanges.monthly >= 0 ? '+' : ''}{(product.priceChanges.monthly * 100).toFixed(2)}%
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div className="change-item">
                  <p>年涨跌幅</p>
                  <p style={{ color: product.priceChanges.yearly >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {product.priceChanges.yearly >= 0 ? '+' : ''}{(product.priceChanges.yearly * 100).toFixed(2)}%
                  </p>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 确认订单弹窗 */}
      <Modal
        title={`确认${orderType === 'buy' ? '买入' : '卖出'}`}
        open={isModalVisible}
        onOk={handleOrder}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={createOrderMutation.isLoading}
      >
        <Form form={form}>
          <Form.Item>
            <InputNumber value={form.getFieldValue('quantity')} disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductDetail;

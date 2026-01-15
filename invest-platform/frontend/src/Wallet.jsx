import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Space, Tabs, Modal, Form, Input, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, WalletOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { walletApi } from '../api/wallet';
import { useAuthStore } from '../store/authStore';
import './Wallet.css';

const { TabPane } = Tabs;

const Wallet = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [profitPeriod, setProfitPeriod] = useState('daily');

  const [depositForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();

  // 获取交易记录
  const { data: transactionsData } = useQuery('transactions', () =>
    walletApi.getTransactions({ page: 1, limit: 20 })
  );

  // 获取收益统计
  const { data: profitStats } = useQuery(
    ['profitStats', profitPeriod],
    () => walletApi.getProfitStats({ period: profitPeriod }),
    { refetchInterval: 60000 }
  );

  // 充值
  const depositMutation = useMutation(walletApi.deposit, {
    onSuccess: () => {
      message.success('充值申请已提交');
      setDepositModalVisible(false);
      depositForm.resetFields();
      queryClient.invalidateQueries('transactions');
    },
    onError: (error) => {
      message.error(error.response?.data?.error || '充值失败');
    },
  });

  // 提现
  const withdrawMutation = useMutation(walletApi.withdraw, {
    onSuccess: () => {
      message.success('提现申请已提交');
      setWithdrawModalVisible(false);
      withdrawForm.resetFields();
      queryClient.invalidateQueries('transactions');
      queryClient.invalidateQueries('user');
    },
    onError: (error) => {
      message.error(error.response?.data?.error || '提现失败');
    },
  });

  const handleDeposit = () => {
    depositForm.validateFields().then((values) => {
      depositMutation.mutate(values);
    });
  };

  const handleWithdraw = () => {
    withdrawForm.validateFields().then((values) => {
      withdrawMutation.mutate(values);
    });
  };

  const transactionColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          deposit: '充值',
          withdraw: '提现',
          buy: '买入',
          sell: '卖出',
          fee: '手续费',
          commission: '返佣',
          profit: '盈利',
          loss: '亏损',
          settlement: '结算',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) => (
        <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}
        </span>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (value) => value.toFixed(2),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <div className="wallet-container">
      {/* 账户信息 */}
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
              title="冻结资金"
              value={user?.frozenBalance || 0}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="元"
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
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="累计返佣"
              value={user?.totalCommission || 0}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Card style={{ marginTop: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<ArrowUpOutlined />}
            onClick={() => setDepositModalVisible(true)}
          >
            充值
          </Button>
          <Button
            type="primary"
            icon={<ArrowDownOutlined />}
            onClick={() => setWithdrawModalVisible(true)}
            disabled={user?.verificationStatus !== 'verified'}
          >
            提现
          </Button>
          {user?.verificationStatus !== 'verified' && (
            <span style={{ color: '#ff4d4f' }}>请先完成实名认证</span>
          )}
        </Space>
      </Card>

      {/* 收益统计 */}
      <Card title="收益统计" style={{ marginTop: 24 }}>
        <Tabs activeKey={profitPeriod} onChange={setProfitPeriod}>
          <TabPane tab="日收益" key="daily" />
          <TabPane tab="周收益" key="weekly" />
          <TabPane tab="月收益" key="monthly" />
          <TabPane tab="年收益" key="yearly" />
        </Tabs>

        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="总收益"
                value={profitStats?.totalNetProfit || 0}
                precision={2}
                valueStyle={{ color: (profitStats?.totalNetProfit || 0) >= 0 ? '#3f8600' : '#cf1322' }}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="已实现收益"
                value={(profitStats?.totalProfit || 0) - (profitStats?.totalLoss || 0)}
                precision={2}
                valueStyle={{ color: ((profitStats?.totalProfit || 0) - (profitStats?.totalLoss || 0)) >= 0 ? '#3f8600' : '#cf1322' }}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="持仓收益"
                value={profitStats?.currentPositionProfit || 0}
                precision={2}
                valueStyle={{ color: (profitStats?.currentPositionProfit || 0) >= 0 ? '#3f8600' : '#cf1322' }}
                suffix="元"
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 交易记录 */}
      <Card title="交易记录" style={{ marginTop: 24 }}>
        <Table
          dataSource={transactionsData?.transactions || []}
          columns={transactionColumns}
          pagination={{
            total: transactionsData?.pagination?.total || 0,
            pageSize: transactionsData?.pagination?.limit || 20,
            current: transactionsData?.pagination?.page || 1,
          }}
          rowKey="_id"
        />
      </Card>

      {/* 充值弹窗 */}
      <Modal
        title="充值"
        open={depositModalVisible}
        onOk={handleDeposit}
        onCancel={() => setDepositModalVisible(false)}
        confirmLoading={depositMutation.isLoading}
      >
        <Form form={depositForm}>
          <Form.Item
            name="amount"
            label="充值金额"
            rules={[
              { required: true, message: '请输入充值金额' },
              { type: 'number', min: 0.01, message: '充值金额必须大于0.01' },
            ]}
          >
            <Input placeholder="请输入充值金额" suffix="元" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 提现弹窗 */}
      <Modal
        title="提现"
        open={withdrawModalVisible}
        onOk={handleWithdraw}
        onCancel={() => setWithdrawModalVisible(false)}
        confirmLoading={withdrawMutation.isLoading}
      >
        <Form form={withdrawForm}>
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[
              { required: true, message: '请输入提现金额' },
              { type: 'number', min: 0.01, message: '提现金额必须大于0.01' },
            ]}
          >
            <Input placeholder="请输入提现金额" suffix="元" />
          </Form.Item>
          <Form.Item
            name="bankName"
            label="银行名称"
            rules={[{ required: true, message: '请输入银行名称' }]}
          >
            <Input placeholder="请输入银行名称" />
          </Form.Item>
          <Form.Item
            name="bankAccount"
            label="银行账号"
            rules={[{ required: true, message: '请输入银行账号' }]}
          >
            <Input placeholder="请输入银行账号" />
          </Form.Item>
          <Form.Item
            name="accountName"
            label="账户姓名"
            rules={[{ required: true, message: '请输入账户姓名' }]}
          >
            <Input placeholder="请输入账户姓名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Wallet;

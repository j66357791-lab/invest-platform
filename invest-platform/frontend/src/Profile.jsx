import { useState } from 'react';
import { Card, Row, Col, Form, Input, Button, Upload, message, Descriptions, Tag, Modal } from 'antd';
import { UserOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons';
import { useQueryClient } from 'react-query';
import { userApi } from '../api/user';
import { useAuthStore } from '../store/authStore';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [verificationForm] = Form.useForm();

  const handleUpdateProfile = async () => {
    try {
      form.validateFields().then(async (values) => {
        // 这里应该调用更新用户信息的API
        updateUser(values);
        message.success('更新成功');
        setEditing(false);
      });
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  const handleSubmitVerification = async () => {
    try {
      verificationForm.validateFields().then(async (values) => {
        await userApi.submitVerification(values);
        message.success('实名认证已提交，等待审核');
        setVerificationModalVisible(false);
        verificationForm.resetFields();
        queryClient.invalidateQueries('user');
      });
    } catch (error) {
      console.error('提交实名认证失败:', error);
    }
  };

  const verificationStatusMap = {
    unverified: { text: '未认证', color: 'default' },
    pending: { text: '审核中', color: 'processing' },
    verified: { text: '已认证', color: 'success' },
    rejected: { text: '已拒绝', color: 'error' },
  };

  const statusInfo = verificationStatusMap[user?.verificationStatus] || verificationStatusMap.unverified;

  return (
    <div className="profile-container">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          {/* 用户信息卡片 */}
          <Card>
            <div className="user-header">
              <UserOutlined className="user-avatar" />
              <h2>{user?.username}</h2>
              <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
            </div>
            
            <Descriptions column={1} bordered>
              <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
              <Descriptions.Item label="手机号">{user?.phone || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="邀请码">{user?.inviteCode}</Descriptions.Item>
              <Descriptions.Item label="邀请人数">{user?.invitedCount || 0}</Descriptions.Item>
            </Descriptions>

            {user?.verificationStatus !== 'verified' && (
              <Button
                type="primary"
                block
                style={{ marginTop: 16 }}
                onClick={() => setVerificationModalVisible(true)}
              >
                {user?.verificationStatus === 'unverified' ? '去实名认证' : '重新认证'}
              </Button>
            )}
          </Card>
        </Col>

        <Col xs={24} md={16}>
          {/* 账户设置 */}
          <Card
            title="账户设置"
            extra={
              <Button onClick={() => setEditing(!editing)}>
                {editing ? '取消' : '编辑'}
              </Button>
            }
          >
            <Form
              form={form}
              initialValues={user}
              layout="vertical"
              disabled={!editing}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱' },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              {editing && (
                <Form.Item>
                  <Button type="primary" onClick={handleUpdateProfile}>
                    保存
                  </Button>
                </Form.Item>
              )}
            </Form>
          </Card>

          {/* 实名认证信息 */}
          {user?.verificationStatus !== 'unverified' && (
            <Card title="实名认证信息" style={{ marginTop: 24 }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="状态">
                  <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                </Descriptions.Item>
                {user?.realName && (
                  <Descriptions.Item label="真实姓名">{user.realName}</Descriptions.Item>
                )}
                {user?.idCard && (
                  <Descriptions.Item label="身份证号">{user.idCard}</Descriptions.Item>
                )}
                {user?.verificationRejectReason && (
                  <Descriptions.Item label="拒绝原因">{user.verificationRejectReason}</Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>

      {/* 实名认证弹窗 */}
      <Modal
        title="实名认证"
        open={verificationModalVisible}
        onOk={handleSubmitVerification}
        onCancel={() => setVerificationModalVisible(false)}
        okText="提交"
        cancelText="取消"
      >
        <Form form={verificationForm} layout="vertical">
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            name="idCard"
            label="身份证号"
            rules={[
              { required: true, message: '请输入身份证号' },
              {
                pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
                message: '请输入有效的身份证号',
              },
            ]}
          >
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item
            name="idCardFront"
            label="身份证正面"
            rules={[{ required: true, message: '请上传身份证正面照片' }]}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              accept="image/*"
              customRequest={({ onSuccess }) => {
                setTimeout(() => {
                  onSuccess('ok');
                }, 0);
              }}
            >
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>上传</div>
            </Upload>
          </Form.Item>
          <Form.Item
            name="idCardBack"
            label="身份证背面"
            rules={[{ required: true, message: '请上传身份证背面照片' }]}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              accept="image/*"
              customRequest={({ onSuccess }) => {
                setTimeout(() => {
                  onSuccess('ok');
                }, 0);
              }}
            >
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>上传</div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;

import express from 'express';
import { auth } from '../middleware/auth.js';
import { admin, superAdmin } from '../middleware/role.js';
import { logAdminAction } from '../middleware/logger.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

// 需要管理员认证的路由
router.use(auth, admin);

// 产品管理
router.post('/products', logAdminAction('product', 'create_product'), adminController.createProduct);
router.put('/products/:id/price', logAdminAction('product', 'update_price'), adminController.updateProductPrice);
router.post('/products/kline', logAdminAction('product', 'add_kline_data'), adminController.addKLineData);

// 审核管理
router.put('/withdraw/:requestId/audit', logAdminAction('withdraw', 'audit_withdraw'), adminController.auditWithdraw);
router.put('/users/:userId/verify', logAdminAction('verification', 'audit_verification'), adminController.auditVerification);

// 统计和日志
router.get('/stats', adminController.getStats);
router.get('/logs', logAdminAction('admin', 'view_logs'), adminController.getAdminLogs);

export default router;

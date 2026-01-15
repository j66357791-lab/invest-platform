import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import * as orderController from '../controllers/order.controller.js';

const router = express.Router();

// 需要认证的路由
router.post('/', auth, [
  body('productId').notEmpty().withMessage('产品ID不能为空'),
  body('type').isIn(['buy', 'sell']).withMessage('订单类型无效'),
  body('quantity').isFloat({ min: 1 }).withMessage('数量必须大于0')
], orderController.createOrder);

router.get('/', auth, orderController.getUserOrders);
router.get('/positions', auth, orderController.getUserPositions);

export default router;

import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import * as walletController from '../controllers/wallet.controller.js';

const router = express.Router();

// 需要认证的路由
router.post('/deposit', auth, [
  body('amount').isFloat({ min: 0.01 }).withMessage('充值金额必须大于0.01')
], walletController.deposit);

router.post('/withdraw', auth, [
  body('amount').isFloat({ min: 0.01 }).withMessage('提现金额必须大于0.01'),
  body('bankName').notEmpty().withMessage('银行名称不能为空'),
  body('bankAccount').notEmpty().withMessage('银行账号不能为空'),
  body('accountName').notEmpty().withMessage('账户姓名不能为空')
], walletController.withdraw);

router.get('/transactions', auth, walletController.getTransactions);
router.get('/profit-stats', auth, walletController.getProfitStats);

export default router;

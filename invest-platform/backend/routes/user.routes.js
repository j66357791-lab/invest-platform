import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

// 公开路由
router.post('/register', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('email').isEmail().withMessage('请输入有效的邮箱'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], userController.register);

router.post('/login', [
  body('email').isEmail().withMessage('请输入有效的邮箱'),
  body('password').notEmpty().withMessage('密码不能为空')
], userController.login);

// 需要认证的路由
router.get('/profile', auth, userController.getProfile);
router.post('/verify', auth, userController.submitVerification);

export default router;

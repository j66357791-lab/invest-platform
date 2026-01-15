import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import * as productController from '../controllers/product.controller.js';

const router = express.Router();

// 公开路由
router.get('/', optionalAuth, productController.getProducts);
router.get('/rankings', optionalAuth, productController.getRankings);
router.get('/:id', optionalAuth, productController.getProduct);
router.get('/:id/kline', optionalAuth, productController.getKLineData);

export default router;

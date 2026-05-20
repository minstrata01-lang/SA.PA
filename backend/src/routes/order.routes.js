import { Router } from 'express';
import { getOrderStatus } from '../controllers/order.controller.js';

const router = Router();

router.get('/:id/status', getOrderStatus);

export default router;

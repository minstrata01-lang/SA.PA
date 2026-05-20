import * as orderService from '../services/order.service.js';

export async function getOrderStatus(req, res, next) {
  try {
    const order = await orderService.getOrderStatus(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
}

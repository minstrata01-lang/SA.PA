import * as productService from '../services/product.service.js';

export async function getAllProducts(req, res, next) {
  try {
    const products = await productService.getAll();
    res.json(products);
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
}

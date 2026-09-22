import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { calculateOrderTotal } from '../utils/orderUtils.js';
import { isMemoryStoreActive, makeMemoryId, memoryStore } from '../data/store.js';

const router = express.Router();

const findProduct = async (productId) => {
  if (isMemoryStoreActive()) {
    return memoryStore.products.find((product) => product._id === productId) || null;
  }

  return Product.findById(productId);
};

router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    if (isMemoryStoreActive()) {
      const orders = memoryStore.orders.filter((order) => order.userId === req.user.id);
      return res.json(orders);
    }

    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (isMemoryStoreActive()) {
      return res.json(memoryStore.orders);
    }

    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    const normalizedItems = await Promise.all(
      items.map(async (item) => {
        const product = await findProduct(item.productId);

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`);
        }

        if (isMemoryStoreActive()) {
          const target = memoryStore.products.find((entry) => entry._id === item.productId);
          target.stock -= item.quantity;
        } else {
          product.stock -= item.quantity;
          await product.save();
        }

        return {
          productId: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
        };
      })
    );

    const total = calculateOrderTotal(normalizedItems);

    const order = isMemoryStoreActive()
      ? {
          _id: makeMemoryId('order'),
          userId: req.user.id,
          items: normalizedItems,
          total,
          status: 'pending',
          shippingAddress,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : await Order.create({
          userId: req.user.id,
          items: normalizedItems,
          total,
          status: 'pending',
          shippingAddress,
        });

    if (isMemoryStoreActive()) {
      memoryStore.orders.push(order);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;

    if (isMemoryStoreActive()) {
      const index = memoryStore.orders.findIndex((order) => order._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Order not found' });
      }

      memoryStore.orders[index] = { ...memoryStore.orders[index], status, updatedAt: new Date().toISOString() };
      return res.json(memoryStore.orders[index]);
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

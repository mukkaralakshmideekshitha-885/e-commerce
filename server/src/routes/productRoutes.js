import express from 'express';
import Product from '../models/Product.js';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware.js';
import { ensureSeedProducts, isMemoryStoreActive, makeMemoryId, memoryStore } from '../data/store.js';

const router = express.Router();

const listProducts = async () => {
  if (isMemoryStoreActive()) {
    return ensureSeedProducts();
  }

  return Product.find().sort({ createdAt: -1 });
};

const findProductById = async (id) => {
  if (isMemoryStoreActive()) {
    return memoryStore.products.find((product) => product._id === id) || null;
  }

  return Product.findById(id);
};

router.get('/', async (req, res) => {
  try {
    const products = await listProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await findProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    if (isMemoryStoreActive()) {
      const product = {
        _id: makeMemoryId('product'),
        ...req.body,
        price: Number(req.body.price),
        stock: Number(req.body.stock),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.products.unshift(product);
      return res.status(201).json(product);
    }

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    if (isMemoryStoreActive()) {
      const index = memoryStore.products.findIndex((product) => product._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Product not found' });
      }

      memoryStore.products[index] = {
        ...memoryStore.products[index],
        ...req.body,
        price: Number(req.body.price || memoryStore.products[index].price),
        stock: Number(req.body.stock || memoryStore.products[index].stock),
        updatedAt: new Date().toISOString(),
      };

      return res.json(memoryStore.products[index]);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    if (isMemoryStoreActive()) {
      const index = memoryStore.products.findIndex((product) => product._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Product not found' });
      }

      memoryStore.products.splice(index, 1);
      return res.json({ message: 'Product deleted successfully' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

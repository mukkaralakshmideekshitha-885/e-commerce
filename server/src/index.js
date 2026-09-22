import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'E-commerce API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

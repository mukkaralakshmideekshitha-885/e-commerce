import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    image: { type: String, default: 'https://via.placeholder.com/300x200?text=Product' },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);

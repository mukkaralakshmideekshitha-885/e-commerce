export const memoryStore = {
  users: [],
  products: [],
  orders: [],
  nextId: 1,
};

export const makeMemoryId = (prefix = 'mem') => `${prefix}_${memoryStore.nextId++}`;

export const ensureSeedProducts = () => {
  if (memoryStore.products.length > 0) {
    return memoryStore.products;
  }

  const seed = [
    {
      _id: makeMemoryId('product'),
      name: 'Noise Cancelling Headphones',
      description: 'Premium sound with wireless comfort.',
      price: 149,
      stock: 12,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    },
    {
      _id: makeMemoryId('product'),
      name: 'Classic Backpack',
      description: 'Water-resistant everyday carry backpack.',
      price: 89,
      stock: 7,
      category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    },
    {
      _id: makeMemoryId('product'),
      name: 'Smart Watch Pro',
      description: 'Track fitness and stay connected throughout the day.',
      price: 199,
      stock: 5,
      category: 'Wearables',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    },
    {
      _id: makeMemoryId('product'),
      name: 'Minimal Lamp',
      description: 'Warm ambient lighting for modern interiors.',
      price: 74,
      stock: 10,
      category: 'Home',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    },
  ];

  memoryStore.products.push(...seed);
  return memoryStore.products;
};

export const isMemoryStoreActive = () => process.env.USE_MEMORY_DB === 'true';

export const ensureDefaultAdminUser = async (bcrypt) => {
  if (!isMemoryStoreActive()) {
    return;
  }

  const existing = memoryStore.users.find((user) => user.email === 'admin@shop.com');
  if (existing) {
    return;
  }

  memoryStore.users.push({
    _id: makeMemoryId('user'),
    name: 'System Admin',
    email: 'admin@shop.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

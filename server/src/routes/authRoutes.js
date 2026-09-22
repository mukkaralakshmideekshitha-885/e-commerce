import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ensureDefaultAdminUser, isMemoryStoreActive, makeMemoryId, memoryStore } from '../data/store.js';

const router = express.Router();

const userLookup = async (email) => {
  if (isMemoryStoreActive()) {
    return memoryStore.users.find((user) => user.email === email) || null;
  }

  return User.findOne({ email });
};

const createUserRecord = async (userData) => {
  if (isMemoryStoreActive()) {
    const user = {
      _id: makeMemoryId('user'),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryStore.users.push(user);
    return user;
  }

  return User.create(userData);
};

router.post('/register', async (req, res) => {
  try {
    await ensureDefaultAdminUser(bcrypt);

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await userLookup(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUserRecord({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
    });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '1d',
    });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    await ensureDefaultAdminUser(bcrypt);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await userLookup(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '1d',
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

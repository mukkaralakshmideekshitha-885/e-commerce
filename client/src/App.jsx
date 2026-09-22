import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

const initialProducts = [
  { _id: 'p1', name: 'Noise Cancelling Headphones', description: 'Premium sound with wireless comfort.', price: 149, stock: 12, category: 'Electronics', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80' },
  { _id: 'p2', name: 'Classic Backpack', description: 'Water-resistant everyday carry backpack.', price: 89, stock: 7, category: 'Accessories', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80' },
  { _id: 'p3', name: 'Smart Watch Pro', description: 'Track fitness and stay connected throughout the day.', price: 199, stock: 5, category: 'Wearables', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
  { _id: 'p4', name: 'Minimal Lamp', description: 'Warm ambient lighting for modern interiors.', price: 74, stock: 10, category: 'Home', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80' },
];

function App() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('shop_user') || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem('shop_token') || '');
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [adminForm, setAdminForm] = useState({ name: '', description: '', price: '', stock: '', category: '', image: '' });

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data) && data.length) setProducts(data);
      } catch (error) {
        console.error('Failed to load products', error);
      }
    };

    loadProducts();
  }, []);

  const saveSession = (sessionUser, sessionToken) => {
    setUser(sessionUser);
    setToken(sessionToken);
    localStorage.setItem('shop_user', JSON.stringify(sessionUser));
    localStorage.setItem('shop_token', sessionToken);
  };

  const handleAuth = async (event) => {
    event.preventDefault();

    const endpoint = authMode === 'login' ? 'auth/login' : 'auth/register';
    const payload = authMode === 'login'
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password, role: formData.role };

    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      saveSession(data.user, data.token);
      setFormData({ name: '', email: '', password: '', role: 'user' });
      navigate('/');
    } catch (error) {
      alert(error.message);
    }
  };

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item._id === product._id);
      if (existing) {
        return currentCart.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item._id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleCheckout = async () => {
    if (!user) {
      alert('Please sign in before checking out.');
      navigate('/login');
      return;
    }

    if (!cart.length) {
      alert('Your cart is empty.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })),
          shippingAddress: {
            street: '123 Demo Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Checkout failed');

      alert('Order placed successfully!');
      setCart([]);
      navigate('/orders');
    } catch (error) {
      alert(error.message);
    }
  };

  const addProduct = async (event) => {
    event.preventDefault();
    if (!token || user?.role !== 'admin') {
      alert('Admin access required.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: adminForm.name,
          description: adminForm.description,
          price: Number(adminForm.price),
          stock: Number(adminForm.stock),
          category: adminForm.category,
          image: adminForm.image || 'https://via.placeholder.com/300x200?text=New+Product',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to add product');
      setProducts((current) => [data, ...current]);
      setAdminForm({ name: '', description: '', price: '', stock: '', category: '', image: '' });
    } catch (error) {
      alert(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('shop_user');
    localStorage.removeItem('shop_token');
    setUser(null);
    setToken('');
    navigate('/');
  };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <Link to="/"><strong>ShopSphere</strong></Link>
        <div className="navlinks">
          <Link to="/">Home</Link>
          <Link to="/orders">Orders</Link>
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user ? (
            <>
              <span>Hello, {user.name}</span>
              <button className="secondary-btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link to="/login"><button className="primary-btn">Login</button></Link>
          )}
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <>
              <section className="hero">
                <div>
                  <p style={{ textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.75 }}>New Season</p>
                  <h1>Modern essentials for everyday living.</h1>
                  <p>Discover fresh tech, home finds, and accessories with a streamlined shopping experience.</p>
                  <button className="primary-btn" onClick={() => navigate('/login')}>Shop now</button>
                </div>
                <div style={{ fontSize: '4rem' }}>🛍️</div>
              </section>

              <div className="grid">
                {products.map((product) => (
                  <div key={product._id} className="card product-card">
                    <img className="product-image" src={product.image} alt={product.name} />
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="price-row">
                      <strong>{formatCurrency(product.price)}</strong>
                      <span>{product.stock} left</span>
                    </div>
                    <button className="primary-btn" style={{ width: '100%', marginTop: 14 }} onClick={() => addToCart(product)}>
                      Add to cart
                    </button>
                  </div>
                ))}
              </div>
            </>
          }
        />

        <Route
          path="/login"
          element={
            <div className="card" style={{ maxWidth: 480, margin: '40px auto' }}>
              <h2>{authMode === 'login' ? 'Login' : 'Create account'}</h2>
              <form className="form" onSubmit={handleAuth}>
                {authMode === 'register' && (
                  <>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    />
                    <select value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value })}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </>
                )}
                <input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                />
                {authMode === 'login' && <small>Demo admin: admin@shop.com / admin123</small>}
                <button className="primary-btn" type="submit">{authMode === 'login' ? 'Sign in' : 'Register'}</button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                >
                  {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
                </button>
              </form>
            </div>
          }
        />

        <Route
          path="/orders"
          element={
            <div className="card" style={{ marginTop: 24 }}>
              <h2>Your orders</h2>
              {!user ? <p>Please log in to view your orders.</p> : <p>Order tracking is available after checkout.</p>}
            </div>
          }
        />

        <Route
          path="/admin"
          element={
            user?.role === 'admin' ? (
              <div className="dashboard" style={{ marginTop: 24 }}>
                <div className="card">
                  <h2>Add product</h2>
                  <form className="form" onSubmit={addProduct}>
                    <input placeholder="Product name" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
                    <input placeholder="Description" value={adminForm.description} onChange={(e) => setAdminForm({ ...adminForm, description: e.target.value })} />
                    <input placeholder="Price" type="number" value={adminForm.price} onChange={(e) => setAdminForm({ ...adminForm, price: e.target.value })} />
                    <input placeholder="Stock" type="number" value={adminForm.stock} onChange={(e) => setAdminForm({ ...adminForm, stock: e.target.value })} />
                    <input placeholder="Category" value={adminForm.category} onChange={(e) => setAdminForm({ ...adminForm, category: e.target.value })} />
                    <input placeholder="Image URL" value={adminForm.image} onChange={(e) => setAdminForm({ ...adminForm, image: e.target.value })} />
                    <button className="primary-btn" type="submit">Save product</button>
                  </form>
                </div>

                <div className="card">
                  <h2>Inventory</h2>
                  <ul>
                    {products.map((product) => (
                      <li key={product._id} style={{ marginBottom: 10 }}>
                        {product.name} — {product.stock} in stock
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="card" style={{ marginTop: 24 }}>
                <h2>Access denied</h2>
                <p>Only admins can access this panel.</p>
              </div>
            )
          }
        />
      </Routes>

      <aside className="card" style={{ position: 'fixed', right: 18, top: 120, width: 300, maxHeight: '70vh', overflow: 'auto' }}>
        <h3>Cart</h3>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item._id} className="cart-item">
                <div>
                  <strong>{item.name}</strong>
                  <div>{formatCurrency(item.price)} x {item.quantity}</div>
                </div>
                <div>
                  <button className="secondary-btn" onClick={() => updateQuantity(item._id, -1)}>-</button>
                  <button className="secondary-btn" onClick={() => updateQuantity(item._id, 1)}>+</button>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <button className="primary-btn" style={{ width: '100%', marginTop: 16 }} onClick={handleCheckout}>Checkout</button>
          </>
        )}
      </aside>
    </div>
  );
}

export default App;

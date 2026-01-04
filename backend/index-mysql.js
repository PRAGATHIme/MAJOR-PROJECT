// Load environment variables
require('dotenv').config();

const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");
const db = require("./database/db");
const { logForensicEvent } = require("./middleware/forensicLogger");

app.use(express.json());
app.use(cors());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "ecommerce_secret_key_2024";

// Debug: Log environment variables (remove in production)
console.log('Environment loaded:', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'NOT SET',
  JWT_SECRET: JWT_SECRET ? 'SET' : 'NOT SET'
});

// Ensure upload/images folder exists
const dir = "./upload/images";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// API check
app.get("/", (req, res) => {
  res.send("Express App is Running with MySQL");
});

// Image storage engine
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });
app.use('/images', express.static('upload/images'));

// Upload endpoint
app.post("/upload", upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, message: "No file uploaded" });
  }
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`
  });
});

// ============ USER AUTHENTICATION ============

// User Registration
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;

    // Check if user exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, firstName || null, lastName || null, phone || null]
    );

    const userId = result.insertId;

    // Create JWT token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    // Log registration event
    await logForensicEvent({
      userId,
      sessionId: token.substring(0, 20),
      eventType: 'user_registration',
      eventStatus: 'success',
      req
    });

    res.json({ success: true, token, userId });
  } catch (err) {
    console.error("❌ Signup error:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      // Increment failed login attempts
      await db.query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = ?',
        [user.user_id]
      );

      await logForensicEvent({
        userId: user.user_id,
        sessionId: 'failed_login',
        eventType: 'login_attempt',
        eventStatus: 'failed',
        req,
        errorMessage: 'Invalid password'
      });

      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Update last login and reset failed attempts
    await db.query(
      'UPDATE users SET last_login = NOW(), failed_login_attempts = 0 WHERE user_id = ?',
      [user.user_id]
    );

    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    await logForensicEvent({
      userId: user.user_id,
      sessionId: token.substring(0, 20),
      eventType: 'login',
      eventStatus: 'success',
      req
    });

    res.json({ success: true, token, userId: user.user_id });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ MIDDLEWARE: Verify JWT Token ============
const verifyToken = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid token" });
  }
};

// ============ PRODUCT MANAGEMENT ============

// Add product
app.post('/addproduct', async (req, res) => {
  try {
    const { name, image, category, new_price, old_price, stock_quantity, description } = req.body;

    const [result] = await db.query(
      'INSERT INTO products (name, image, category, new_price, old_price, stock_quantity, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, image, category, new_price, old_price || new_price, stock_quantity || 0, description || '']
    );

    console.log("✅ Product Saved:", name);
    res.json({ success: true, productId: result.insertId, name });
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Remove product
app.post('/removeproduct', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM products WHERE product_id = ?', [req.body.id]);
    
    if (result.affectedRows > 0) {
      console.log("🗑️ Removed product ID:", req.body.id);
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Product not found" });
    }
  } catch (err) {
    console.error("❌ Error removing product:", err);
    res.status(500).json({ success: false });
  }
});

// Get all products
app.get('/allproducts', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE available = TRUE ORDER BY created_at DESC');
    
    // Transform to match frontend expectations (product_id -> id)
    const transformedProducts = products.map(p => ({
      id: p.product_id,
      name: p.name,
      image: p.image,
      category: p.category,
      new_price: parseFloat(p.new_price),
      old_price: parseFloat(p.old_price),
      available: p.available,
      date: p.created_at
    }));

    res.json(transformedProducts);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get single product
app.get('/product/:id', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const p = products[0];
    res.json({
      id: p.product_id,
      name: p.name,
      image: p.image,
      category: p.category,
      new_price: parseFloat(p.new_price),
      old_price: parseFloat(p.old_price),
      available: p.available,
      stock_quantity: p.stock_quantity,
      description: p.description
    });
  } catch (err) {
    console.error("❌ Error fetching product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ CART MANAGEMENT ============

// Add to cart
app.post('/addtocart', verifyToken, async (req, res) => {
  try {
    const { productId, quantity = 1, setQuantity = false } = req.body;
    const userId = req.user.userId;

    console.log(`📦 Add to cart: User ${userId}, Product ${productId}, Qty ${quantity}, SetQty: ${setQuantity}`);

    // Get product details
    const [products] = await db.query('SELECT * FROM products WHERE product_id = ?', [productId]);
    if (products.length === 0) {
      console.log(`❌ Product ${productId} not found`);
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = products[0];

    // Check if item already in cart
    const [existing] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing.length > 0) {
      // Update quantity - either set or add based on setQuantity flag
      if (setQuantity) {
        console.log(`🔄 Setting quantity to ${quantity} for product ${productId}`);
        await db.query(
          'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
          [quantity, userId, productId]
        );
      } else {
        console.log(`➕ Adding ${quantity} to existing quantity for product ${productId}`);
        await db.query(
          'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
          [quantity, userId, productId]
        );
      }
    } else {
      console.log(`✨ Creating new cart item for product ${productId}`);
      // Insert new cart item
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
    }

    // Log forensic event
    await logForensicEvent({
      userId,
      sessionId: req.header('auth-token')?.substring(0, 20),
      productId,
      eventType: 'add_to_cart',
      eventStatus: 'success',
      transactionAmount: parseFloat(product.new_price) * quantity,
      productCategory: product.category,
      quantity,
      req
    });

    console.log(`✅ Cart updated successfully for user ${userId}`);
    res.json({ success: true, message: "Added to cart", productId, quantity });
  } catch (err) {
    console.error("❌ Error adding to cart:", err.message);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

// Remove from cart
app.post('/removefromcart', verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userId;

    // Get product details for logging
    const [products] = await db.query('SELECT * FROM products WHERE product_id = ?', [productId]);
    const product = products[0];

    const [result] = await db.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (result.affectedRows > 0) {
      // Log forensic event
      await logForensicEvent({
        userId,
        sessionId: req.header('auth-token')?.substring(0, 20),
        productId,
        eventType: 'remove_from_cart',
        eventStatus: 'success',
        productCategory: product?.category,
        req
      });

      res.json({ success: true, message: "Removed from cart" });
    } else {
      res.json({ success: false, message: "Item not in cart" });
    }
  } catch (err) {
    console.error("❌ Error removing from cart:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get cart items
app.get('/getcart', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [cartItems] = await db.query(`
      SELECT ci.cart_item_id, ci.quantity, 
             p.product_id as id, p.name, p.image, p.category, p.new_price, p.old_price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.user_id = ?
    `, [userId]);

    res.json({ success: true, cartItems });
  } catch (err) {
    console.error("❌ Error fetching cart:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ CHECKOUT & ORDERS ============

// Checkout
app.post('/checkout', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.userId;
    const { paymentMethod, shippingAddress, shippingCoordinates } = req.body;

    console.log(`🛒 Checkout initiated for user ${userId}`);

    // Get cart items
    const [cartItems] = await connection.query(`
      SELECT ci.product_id, ci.quantity, p.new_price, p.category, p.name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.user_id = ?
    `, [userId]);

    console.log(`📦 Found ${cartItems.length} items in cart for user ${userId}`);

    if (cartItems.length === 0) {
      await connection.rollback();
      console.log(`❌ Cart is empty for user ${userId}`);
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => 
      sum + (parseFloat(item.new_price) * item.quantity), 0
    );

    // Create order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, payment_method, shipping_address, payment_status, order_status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, totalAmount, paymentMethod, shippingAddress, 'completed', 'processing']
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of cartItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.new_price]
      );
    }

    // Clear cart
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    // Log forensic event for checkout
    await logForensicEvent({
      userId,
      sessionId: req.header('auth-token')?.substring(0, 20),
      orderId,
      eventType: 'checkout',
      eventStatus: 'success',
      transactionAmount: totalAmount,
      paymentMethod,
      productCategory: cartItems[0].category,
      quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      req,
      shippingCoordinates
    });

    await connection.commit();
    res.json({ success: true, orderId, totalAmount, message: "Order placed successfully" });

  } catch (err) {
    await connection.rollback();
    console.error("❌ Checkout error:", err);
    
    // Log failed checkout
    await logForensicEvent({
      userId: req.user.userId,
      sessionId: req.header('auth-token')?.substring(0, 20),
      eventType: 'checkout',
      eventStatus: 'failed',
      req,
      errorMessage: err.message
    });

    res.status(500).json({ success: false, message: "Checkout failed" });
  } finally {
    connection.release();
  }
});

// Get user orders
app.get('/myorders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [orders] = await db.query(`
      SELECT o.order_id, o.total_amount, o.payment_method, o.order_status, o.created_at,
             GROUP_CONCAT(p.name SEPARATOR ', ') as products
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE o.user_id = ?
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({ success: true, orders });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ ANALYTICS & FORENSIC LOGS ============

// Get forensic logs (admin only - add proper auth in production)
app.get('/forensiclogs', async (req, res) => {
  try {
    const { limit = 100, eventType, userId, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM forensic_logs WHERE 1=1';
    const params = [];

    if (eventType) {
      query += ' AND event_type = ?';
      params.push(eventType);
    }

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));

    const [logs] = await db.query(query, params);
    res.json({ success: true, logs, count: logs.length });
  } catch (err) {
    console.error("❌ Error fetching logs:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get fraud analytics
app.get('/fraudanalytics', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN is_fraudulent = TRUE THEN 1 ELSE 0 END) as fraudulent_count,
        AVG(fraud_score) as avg_fraud_score,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM forensic_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    res.json({ success: true, analytics: stats[0] });
  } catch (err) {
    console.error("❌ Error fetching analytics:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(port, () => {
  console.log("🚀 Server running on port " + port);
  console.log("📊 Forensic logging enabled");
});

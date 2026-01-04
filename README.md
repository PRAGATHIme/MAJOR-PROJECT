# E-Commerce Platform with Forensic Logging

A full-stack e-commerce application with MySQL database and comprehensive forensic logging for fraud detection.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL (v8.0+)

### Setup

1. **Start MySQL:**
   ```bash
   net start MySQL80
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npm run start:mysql
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000

## 📊 Database

### Configuration
Edit `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_db
JWT_SECRET=your_secret_key
PORT=4000
```

### Tables
- **users** - User accounts and authentication
- **products** - Product catalog
- **orders** - Customer orders
- **order_items** - Order details
- **cart_items** - Shopping cart
- **forensic_logs** - Transaction logging with fraud detection

## 🔐 Features

### User Authentication
- JWT-based authentication
- Secure password hashing (bcrypt)
- Login/Signup functionality

### Shopping
- Product browsing
- Add to cart
- Checkout process
- Order history

### Forensic Logging
Every transaction logs:
- User behavior (account age, order history)
- Transaction details (amount, payment method)
- Device info (mobile/desktop, browser)
- Network data (IP, geolocation, VPN detection)
- Fraud scoring (0-100 scale)

## 🔌 API Endpoints

### Public
- `POST /signup` - Register user
- `POST /login` - User login
- `GET /allproducts` - List products
- `GET /product/:id` - Get product

### Protected (Requires JWT)
- `POST /addtocart` - Add to cart
- `POST /removefromcart` - Remove from cart
- `GET /getcart` - View cart
- `POST /checkout` - Complete purchase
- `GET /myorders` - Order history

### Analytics
- `GET /forensiclogs` - View transaction logs
- `GET /fraudanalytics` - Fraud statistics

## 📁 Project Structure

```
├── backend/
│   ├── database/
│   │   ├── schema.sql          # Database schema
│   │   ├── db.js               # MySQL connection
│   │   ├── migrate.js          # MongoDB migration
│   │   └── analytics_queries.sql # SQL queries
│   ├── middleware/
│   │   └── forensicLogger.js   # Logging system
│   ├── index-mysql.js          # Main backend (MySQL)
│   ├── index.js                # Original backend (MongoDB)
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── Components/
│   │   ├── Pages/
│   │   └── Context/
│   └── package.json
└── README.md
```

## 🧪 Testing

```bash
cd backend
npm test
```

## 📚 Documentation

- **backend/README.md** - Backend documentation
- **backend/ARCHITECTURE.md** - System architecture
- **backend/FORENSIC_LOGGING.md** - Logging details
- **backend/database/analytics_queries.sql** - 20+ SQL queries

## 🔍 View Logs

### API
```bash
curl http://localhost:4000/forensiclogs?limit=10
curl http://localhost:4000/fraudanalytics
```

### Database
```sql
mysql -u root -p ecommerce_db
SELECT * FROM forensic_logs ORDER BY timestamp DESC LIMIT 10;
```

## 🛠️ Maintenance

### Start Servers
```bash
# Backend
cd backend && npm run start:mysql

# Frontend
cd frontend && npm start
```

### Database Backup
```bash
mysqldump -u root -p ecommerce_db > backup.sql
```

## 📝 License

ISC

## 🎉 Features Summary

✅ MySQL database with 6 tables
✅ User authentication (JWT + bcrypt)
✅ Shopping cart with persistence
✅ Complete checkout system
✅ Forensic logging (15+ data points per transaction)
✅ Fraud detection with scoring
✅ IP geolocation & VPN detection
✅ Real-time analytics
✅ 20+ ready-to-use SQL queries

---

**Your e-commerce platform is ready!** 🚀

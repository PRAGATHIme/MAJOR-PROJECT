# E-Commerce Backend - MySQL with Forensic Logging

Complete backend migration from MongoDB to MySQL with enterprise-grade forensic logging and fraud detection.

## 🎯 What's New

### Database Migration
- ✅ **MongoDB → MySQL** complete migration
- ✅ **Relational schema** with proper foreign keys
- ✅ **Optimized indexes** for performance
- ✅ **Connection pooling** for scalability

### Forensic Logging System
- ✅ **Real-time transaction logging** for all events
- ✅ **Fraud detection** with scoring algorithm
- ✅ **IP geolocation** and VPN/Proxy detection
- ✅ **User behavior tracking** (account age, order history)
- ✅ **Device fingerprinting** (mobile/desktop/tablet)
- ✅ **Distance calculation** between IP and shipping address
- ✅ **Comprehensive analytics** with 20+ ready-to-use queries

### New Features
- 🔐 **JWT Authentication** with bcrypt password hashing
- 🛒 **Cart Management** with persistent storage
- 💳 **Checkout System** with transaction logging
- 📊 **Analytics Endpoints** for business intelligence
- 🔍 **Fraud Detection** with multi-factor risk assessment

## 📁 Project Structure

```
backend/
├── database/
│   ├── schema.sql              # MySQL database schema
│   ├── db.js                   # Database connection pool
│   ├── migrate.js              # MongoDB to MySQL migration script
│   └── analytics_queries.sql   # 20+ analytics queries
├── middleware/
│   └── forensicLogger.js       # Forensic logging middleware
├── upload/
│   └── images/                 # Product images
├── index.js                    # Original MongoDB backend
├── index-mysql.js              # New MySQL backend
├── package.json                # Dependencies
├── .env.example                # Environment variables template
├── test-api.js                 # API test suite
├── QUICK_START.md              # 5-minute setup guide
├── SETUP_GUIDE.md              # Detailed setup instructions
├── FORENSIC_LOGGING.md         # Complete logging documentation
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Install MySQL
```bash
# Download from: https://dev.mysql.com/downloads/mysql/
# Or use package manager (brew, apt, etc.)
```

### 2. Create Database
```bash
mysql -u root -p
CREATE DATABASE ecommerce_db;
exit;
```

### 3. Import Schema
```bash
mysql -u root -p ecommerce_db < database/schema.sql
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 6. Start Server
```bash
npm run start:mysql
```

### 7. Test Everything
```bash
npm test
```

## 📊 Database Schema

### Core Tables

**users** - User accounts and authentication
- user_id, email, password_hash, username
- account_created_at, last_login, failed_login_attempts
- Tracks user credentials and login history

**products** - Product catalog
- product_id, name, image, category
- new_price, old_price, stock_quantity
- available, created_at, updated_at

**orders** - Customer orders
- order_id, user_id, total_amount
- payment_method, payment_status, order_status
- shipping_address, created_at

**cart_items** - Shopping cart persistence
- cart_item_id, user_id, product_id, quantity
- Real-time cart synchronization

**forensic_logs** - Transaction logging (⭐ NEW)
- Comprehensive event tracking
- Fraud detection indicators
- User behavior analytics
- Network/location intelligence
- See FORENSIC_LOGGING.md for details

## 🔌 API Endpoints

### Authentication
```bash
POST /signup          # Register new user
POST /login           # User login
```

### Products
```bash
GET  /allproducts     # List all products
GET  /product/:id     # Get single product
POST /addproduct      # Add new product
POST /removeproduct   # Delete product
POST /upload          # Upload product image
```

### Cart (Requires Authentication)
```bash
POST /addtocart       # Add item to cart
POST /removefromcart  # Remove item from cart
GET  /getcart         # Get user's cart
```

### Orders (Requires Authentication)
```bash
POST /checkout        # Complete purchase
GET  /myorders        # Get order history
```

### Analytics & Forensics
```bash
GET /forensiclogs     # Get transaction logs
                      # Query params: limit, eventType, userId, startDate, endDate
GET /fraudanalytics   # Get fraud statistics
```

## 🔍 Forensic Logging Features

Every transaction automatically logs:

### Transaction Data
- Transaction amount
- Payment method
- Product category
- Quantity purchased

### User Behavior
- Account age (days)
- Number of recent orders (last 30 days)
- Failed payment attempts
- Device type (mobile/desktop/tablet)
- Browser information

### Network & Location
- IP address
- IP geolocation (city, country)
- Distance between IP and shipping address
- VPN/Proxy detection status

### Fraud Detection
- Fraud score (0-100)
- Fraudulent transaction flag
- Risk indicators
- Pattern analysis

## 📈 Analytics Queries

20+ ready-to-use SQL queries in `database/analytics_queries.sql`:

- Daily transaction summary
- Fraud detection patterns
- User behavior analysis
- Geographic distribution
- Payment method preferences
- Cart abandonment rates
- Device usage patterns
- Peak transaction hours
- And more...

## 🧪 Testing

### Run Test Suite
```bash
npm test
```

Tests include:
- Server connectivity
- User signup/login
- Product management
- Cart operations
- Forensic logging
- Fraud analytics

### Manual Testing
```bash
# Test server
curl http://localhost:4000/

# Create user
curl -X POST http://localhost:4000/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# View logs
curl http://localhost:4000/forensiclogs?limit=10
```

## 🔒 Security Features

- ✅ **Password hashing** with bcrypt (10 rounds)
- ✅ **JWT authentication** with expiration
- ✅ **SQL injection protection** via parameterized queries
- ✅ **CORS enabled** for frontend integration
- ✅ **Failed login tracking** for brute force detection
- ✅ **VPN/Proxy detection** for fraud prevention
- ✅ **Rate limiting ready** (add middleware)

## 🛠️ Configuration

### Environment Variables (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_db
JWT_SECRET=your_secret_key
PORT=4000
NODE_ENV=development
```

### Database Connection
- Connection pooling (10 connections)
- Auto-reconnect enabled
- Keep-alive for long-running connections

## 📦 Dependencies

### Production
- `express` - Web framework
- `mysql2` - MySQL client with promises
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - Cross-origin resource sharing
- `multer` - File upload handling
- `geoip-lite` - IP geolocation
- `dotenv` - Environment variables

### Development
- `nodemon` - Auto-reload during development
- `axios` - HTTP client for testing

## 🔄 Migration from MongoDB

If you have existing MongoDB data:

```bash
npm run migrate
```

This will:
1. Connect to both MongoDB and MySQL
2. Migrate all products
3. Create sample users for testing
4. Preserve data integrity

## 📚 Documentation

- **QUICK_START.md** - Get running in 5 minutes
- **SETUP_GUIDE.md** - Detailed setup instructions
- **FORENSIC_LOGGING.md** - Complete logging documentation
- **analytics_queries.sql** - Ready-to-use SQL queries

## 🎯 Use Cases

### E-Commerce Operations
- Product catalog management
- User authentication
- Shopping cart persistence
- Order processing
- Payment tracking

### Fraud Detection
- Suspicious transaction identification
- VPN/Proxy usage detection
- Geographic anomaly detection
- Failed payment pattern analysis
- Account age risk assessment

### Business Intelligence
- Sales analytics
- Customer behavior analysis
- Geographic revenue distribution
- Device usage patterns
- Cart abandonment tracking

## 🚨 Troubleshooting

### MySQL Connection Error
```bash
# Check MySQL is running
mysql -u root -p

# Verify database exists
SHOW DATABASES;

# Check credentials in .env
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5000
```

### Migration Issues
```bash
# Ensure MongoDB is running
# Check connection string in migrate.js
```

### Forensic Logs Not Appearing
```bash
# Verify table exists
mysql -u root -p ecommerce_db
SHOW TABLES;
DESCRIBE forensic_logs;
```

## 🔮 Future Enhancements

- [ ] Machine learning fraud detection
- [ ] Real-time alerting system
- [ ] Visual analytics dashboard
- [ ] Advanced device fingerprinting
- [ ] Integration with payment gateways
- [ ] Automated fraud response
- [ ] GraphQL API
- [ ] WebSocket for real-time updates

## 📊 Performance

- **Connection pooling** for efficient database usage
- **Indexed queries** for fast lookups
- **Async logging** to not block requests
- **Optimized schema** with proper foreign keys
- **Query optimization** with EXPLAIN analysis

## 🤝 Contributing

1. Test thoroughly before committing
2. Update documentation for new features
3. Follow existing code style
4. Add tests for new endpoints
5. Update FORENSIC_LOGGING.md for logging changes

## 📄 License

ISC

## 👥 Support

For issues or questions:
1. Check documentation files
2. Review error logs
3. Test with sample data
4. Verify database schema
5. Check MySQL connection

---

**Built with ❤️ for secure e-commerce**

Ready to deploy? See SETUP_GUIDE.md for production deployment checklist.

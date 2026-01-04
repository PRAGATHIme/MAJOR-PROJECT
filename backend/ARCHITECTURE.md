# System Architecture

## Overview

This document describes the architecture of the MySQL-based e-commerce backend with forensic logging.

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  (React/Vue/Angular - Sends requests with auth tokens)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express.js Backend                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Routes     │  │ Middleware   │  │   Auth       │        │
│  │              │  │              │  │              │        │
│  │ • Products   │  │ • CORS       │  │ • JWT        │        │
│  │ • Users      │  │ • JSON       │  │ • bcrypt     │        │
│  │ • Cart       │  │ • Multer     │  │ • Verify     │        │
│  │ • Orders     │  │ • Logger     │  │   Token      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         Forensic Logger Middleware                       │ │
│  │  • Captures all transaction data                         │ │
│  │  • Calculates fraud scores                               │ │
│  │  • Performs IP geolocation                               │ │
│  │  • Detects VPN/Proxy usage                               │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL Database Layer                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    users     │  │   products   │  │    orders    │        │
│  │              │  │              │  │              │        │
│  │ • user_id    │  │ • product_id │  │ • order_id   │        │
│  │ • email      │  │ • name       │  │ • user_id    │        │
│  │ • password   │  │ • price      │  │ • total      │        │
│  │ • created_at │  │ • category   │  │ • status     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ cart_items   │  │ order_items  │  │forensic_logs │        │
│  │              │  │              │  │              │        │
│  │ • user_id    │  │ • order_id   │  │ • log_id     │        │
│  │ • product_id │  │ • product_id │  │ • user_id    │        │
│  │ • quantity   │  │ • quantity   │  │ • event_type │        │
│  │              │  │ • price      │  │ • ip_address │        │
│  └──────────────┘  └──────────────┘  │ • fraud_score│        │
│                                       │ • timestamp  │        │
│                                       └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Registration Flow

```
User → POST /signup → Backend
                        │
                        ├─ Hash password (bcrypt)
                        │
                        ├─ Insert into users table
                        │
                        ├─ Generate JWT token
                        │
                        ├─ Log event to forensic_logs
                        │   • event_type: 'user_registration'
                        │   • ip_address, device, browser
                        │   • geolocation data
                        │
                        └─ Return token to user
```

### 2. Add to Cart Flow

```
User → POST /addtocart (with JWT) → Backend
                                      │
                                      ├─ Verify JWT token
                                      │
                                      ├─ Get product details
                                      │
                                      ├─ Insert/Update cart_items
                                      │
                                      ├─ Log to forensic_logs
                                      │   • event_type: 'add_to_cart'
                                      │   • transaction_amount
                                      │   • product_category
                                      │   • user_account_age_days
                                      │   • number_of_recent_orders
                                      │   • ip_address, geolocation
                                      │   • device_used, browser
                                      │
                                      └─ Return success
```

### 3. Checkout Flow

```
User → POST /checkout (with JWT) → Backend
                                     │
                                     ├─ Verify JWT token
                                     │
                                     ├─ Begin Transaction
                                     │   │
                                     │   ├─ Get cart items
                                     │   │
                                     │   ├─ Calculate total
                                     │   │
                                     │   ├─ Create order record
                                     │   │
                                     │   ├─ Create order_items
                                     │   │
                                     │   ├─ Clear cart
                                     │   │
                                     │   └─ Commit Transaction
                                     │
                                     ├─ Log to forensic_logs
                                     │   • event_type: 'checkout'
                                     │   • transaction_amount
                                     │   • payment_method
                                     │   • Calculate fraud_score
                                     │   • distance_ip_shipping
                                     │   • vpn_proxy_status
                                     │   • All user behavior data
                                     │
                                     └─ Return order confirmation
```

## Forensic Logging Architecture

### Event Capture Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    API Request                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Forensic Logger Middleware                     │
│                                                             │
│  Step 1: Extract Request Data                              │
│  ├─ IP Address                                             │
│  ├─ User Agent                                             │
│  ├─ Referrer                                               │
│  └─ Session ID                                             │
│                                                             │
│  Step 2: Get User Context                                  │
│  ├─ Query user table for account_created_at               │
│  ├─ Calculate account age in days                         │
│  ├─ Count recent orders (last 30 days)                    │
│  └─ Get failed login attempts                             │
│                                                             │
│  Step 3: Device & Browser Detection                        │
│  ├─ Parse user agent string                               │
│  ├─ Detect device type (mobile/desktop/tablet)            │
│  └─ Identify browser                                       │
│                                                             │
│  Step 4: IP Intelligence                                   │
│  ├─ Lookup IP in GeoIP database                           │
│  ├─ Extract city, country, coordinates                    │
│  ├─ Calculate distance to shipping address                │
│  └─ Detect VPN/Proxy usage                                │
│                                                             │
│  Step 5: Fraud Score Calculation                           │
│  ├─ VPN detected: +30 points                              │
│  ├─ Failed payments: +10 per attempt                      │
│  ├─ Large IP distance: +1 per 100km                       │
│  ├─ New account (<7 days): +20 points                     │
│  ├─ High value (>$500): +10 points                        │
│  └─ Total score: 0-100                                     │
│                                                             │
│  Step 6: Insert Log Record                                 │
│  └─ Write to forensic_logs table                          │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌──────────────┐
│    users     │
│              │
│ PK: user_id  │
└──────┬───────┘
       │
       │ 1:N
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│ cart_items   │                    │   orders     │
│              │                    │              │
│ FK: user_id  │                    │ FK: user_id  │
│ FK: product_id│                   │ PK: order_id │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │                                   │ 1:N
       │                                   │
       │                                   ▼
       │                            ┌──────────────┐
       │                            │ order_items  │
       │                            │              │
       │                            │ FK: order_id │
       │                            │ FK: product_id│
       │                            └──────┬───────┘
       │                                   │
       │                                   │
       ▼                                   ▼
┌──────────────┐                    ┌──────────────┐
│   products   │◄───────────────────┤              │
│              │                    │              │
│ PK: product_id│                   │              │
└──────────────┘                    └──────────────┘

┌──────────────┐
│forensic_logs │  (References all tables but allows NULL)
│              │
│ FK: user_id  │  → users (ON DELETE SET NULL)
│ FK: order_id │  → orders (ON DELETE SET NULL)
│ FK: product_id│ → products (ON DELETE SET NULL)
└──────────────┘
```

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Login Request                       │
│              POST /login {email, password}                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Processing                         │
│                                                             │
│  1. Query user by email                                    │
│     └─ SELECT * FROM users WHERE email = ?                 │
│                                                             │
│  2. Compare password with bcrypt                           │
│     └─ bcrypt.compare(password, user.password_hash)        │
│                                                             │
│  3. If invalid:                                            │
│     ├─ Increment failed_login_attempts                     │
│     ├─ Log failed attempt to forensic_logs                 │
│     └─ Return error                                        │
│                                                             │
│  4. If valid:                                              │
│     ├─ Reset failed_login_attempts to 0                    │
│     ├─ Update last_login timestamp                         │
│     ├─ Generate JWT token                                  │
│     │   └─ jwt.sign({userId, email}, SECRET, {exp: 7d})   │
│     ├─ Log successful login to forensic_logs               │
│     └─ Return token                                        │
└─────────────────────────────────────────────────────────────┘
```

### Protected Route Flow

```
┌─────────────────────────────────────────────────────────────┐
│          Request to Protected Endpoint                      │
│     POST /addtocart (Header: auth-token: JWT)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              verifyToken Middleware                         │
│                                                             │
│  1. Extract token from header                              │
│     └─ const token = req.header('auth-token')              │
│                                                             │
│  2. Verify token                                           │
│     └─ jwt.verify(token, JWT_SECRET)                       │
│                                                             │
│  3. If invalid:                                            │
│     └─ Return 401 Unauthorized                             │
│                                                             │
│  4. If valid:                                              │
│     ├─ Attach user data to request                         │
│     │   └─ req.user = {userId, email}                      │
│     └─ Call next()                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Route Handler Executes                         │
│         (User is authenticated, proceed)                    │
└─────────────────────────────────────────────────────────────┘
```

## Fraud Detection System

### Risk Assessment Model

```
┌─────────────────────────────────────────────────────────────┐
│              Transaction Risk Factors                       │
└─────────────────────────────────────────────────────────────┘

Factor 1: VPN/Proxy Detection
├─ Detected: +30 points
└─ Not Detected: +0 points

Factor 2: Failed Payment Attempts
├─ 0 attempts: +0 points
├─ 1-2 attempts: +10 points
├─ 3-5 attempts: +30 points
└─ >5 attempts: +50 points

Factor 3: Account Age
├─ <1 day: +30 points
├─ 1-7 days: +20 points
├─ 8-30 days: +10 points
└─ >30 days: +0 points

Factor 4: IP-Shipping Distance
├─ <100 km: +0 points
├─ 100-500 km: +5 points
├─ 500-1000 km: +10 points
├─ 1000-2000 km: +20 points
└─ >2000 km: +30 points

Factor 5: Transaction Value
├─ <$100: +0 points
├─ $100-$500: +5 points
├─ $500-$1000: +10 points
└─ >$1000: +15 points

Factor 6: Order Frequency
├─ 0 orders (new): +15 points
├─ 1-5 orders: +5 points
└─ >5 orders: +0 points

┌─────────────────────────────────────────────────────────────┐
│                  Total Fraud Score                          │
│                                                             │
│  0-20:   Low Risk      ✅ Auto-approve                     │
│  21-40:  Medium-Low    ⚠️  Monitor                         │
│  41-60:  Medium        ⚠️  Additional verification         │
│  61-80:  Medium-High   🚨 Manual review                    │
│  81-100: High Risk     🛑 Block/Flag                       │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization

### Database Indexing Strategy

```sql
-- User lookups (login, profile)
INDEX idx_email ON users(email)
INDEX idx_username ON users(username)

-- Product queries (catalog, search)
INDEX idx_category ON products(category)
INDEX idx_available ON products(available)

-- Order history
INDEX idx_user_id ON orders(user_id)
INDEX idx_order_status ON orders(order_status)
INDEX idx_created_at ON orders(created_at)

-- Forensic log analysis
INDEX idx_user_id ON forensic_logs(user_id)
INDEX idx_event_type ON forensic_logs(event_type)
INDEX idx_timestamp ON forensic_logs(timestamp)
INDEX idx_ip_address ON forensic_logs(ip_address)
INDEX idx_is_fraudulent ON forensic_logs(is_fraudulent)
INDEX idx_session_id ON forensic_logs(session_id)
```

### Connection Pooling

```javascript
mysql.createPool({
  connectionLimit: 10,      // Max 10 concurrent connections
  queueLimit: 0,            // Unlimited queue
  waitForConnections: true, // Wait if all busy
  enableKeepAlive: true     // Keep connections alive
})
```

## Scalability Considerations

### Horizontal Scaling

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Backend 1  │  │  Backend 2  │  │  Backend 3  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Load Balancer  │
              └─────────┬───────┘
                        │
                        ▼
              ┌─────────────────┐
              │  MySQL Master   │
              └─────────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ Replica │   │ Replica │   │ Replica │
    └─────────┘   └─────────┘   └─────────┘
```

### Data Archiving Strategy

```
Current Data (forensic_logs)
├─ Last 30 days: Hot storage (fast queries)
│
Archive Tables
├─ forensic_logs_2024_12: 31-60 days old
├─ forensic_logs_2024_11: 61-90 days old
└─ forensic_logs_archive: >90 days (compressed)
```

## Monitoring & Alerting

### Key Metrics to Monitor

```
Application Metrics:
├─ Request rate (req/sec)
├─ Response time (ms)
├─ Error rate (%)
└─ Active connections

Database Metrics:
├─ Query execution time
├─ Connection pool usage
├─ Slow query log
└─ Table sizes

Fraud Metrics:
├─ Fraud score distribution
├─ VPN detection rate
├─ Failed payment rate
└─ High-risk transactions/hour
```

---

This architecture provides a robust, scalable foundation for e-commerce operations with comprehensive forensic logging and fraud detection capabilities.

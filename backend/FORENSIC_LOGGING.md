# Forensic Logging System Documentation

## Overview

The forensic logging system provides comprehensive transaction tracking and fraud detection capabilities for your e-commerce platform. Every user interaction is logged with detailed context for security analysis and business intelligence.

## Features

### 1. Transaction Tracking
- **Real-time logging** of all transactions
- **Complete audit trail** for compliance
- **Transaction amount** and payment details
- **Product category** tracking
- **Quantity** and pricing information

### 2. User Behavior Analysis
- **Account age** calculation (days since registration)
- **Recent order history** (last 30 days)
- **Failed payment attempts** tracking
- **Device fingerprinting** (mobile/desktop/tablet)
- **Browser identification**

### 3. Network & Location Intelligence
- **IP address** capture
- **Geolocation** (city, country)
- **Distance calculation** between IP and shipping address
- **VPN/Proxy detection**
- **Country code** tracking

### 4. Fraud Detection
- **Fraud score** (0-100 scale)
- **Fraudulent transaction flagging**
- **Multi-factor risk assessment**
- **Pattern recognition**

## Event Types Logged

| Event Type | Description | Logged Data |
|------------|-------------|-------------|
| `user_registration` | New user signup | User details, IP, device |
| `login` | User login attempt | Success/failure, IP, device |
| `add_to_cart` | Item added to cart | Product, price, category |
| `remove_from_cart` | Item removed from cart | Product, reason |
| `checkout` | Purchase completed | Full order details, payment |
| `payment` | Payment processed | Amount, method, status |
| `view_product` | Product page viewed | Product ID, category |

## Database Schema

### forensic_logs Table Structure

```sql
CREATE TABLE forensic_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Identifiers
    user_id INT,
    session_id VARCHAR(255),
    order_id INT,
    product_id INT,
    
    -- Event Info
    event_type VARCHAR(50),
    event_status VARCHAR(50),
    
    -- Transaction Features
    transaction_amount DECIMAL(10, 2),
    payment_method VARCHAR(50),
    product_category VARCHAR(100),
    quantity INT,
    
    -- User Behavior
    user_account_age_days INT,
    number_of_recent_orders INT,
    failed_payment_attempts INT,
    device_used VARCHAR(100),
    browser VARCHAR(100),
    
    -- Network/Location
    ip_address VARCHAR(45),
    ip_geolocation VARCHAR(255),
    ip_country_code VARCHAR(10),
    distance_ip_shipping DECIMAL(10, 2),
    vpn_proxy_status VARCHAR(50),
    
    -- Fraud Detection
    is_fraudulent BOOLEAN,
    fraud_score DECIMAL(5, 2),
    
    -- Metadata
    user_agent TEXT,
    referrer_url VARCHAR(500),
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Examples

### Logging an Event (Backend)

```javascript
const { logForensicEvent } = require('./middleware/forensicLogger');

// Example: Log add to cart event
await logForensicEvent({
    userId: 123,
    sessionId: req.header('auth-token')?.substring(0, 20),
    productId: 456,
    eventType: 'add_to_cart',
    eventStatus: 'success',
    transactionAmount: 29.99,
    productCategory: 'electronics',
    quantity: 1,
    req: req // Express request object
});

// Example: Log checkout with shipping info
await logForensicEvent({
    userId: 123,
    sessionId: token,
    orderId: 789,
    eventType: 'checkout',
    eventStatus: 'success',
    transactionAmount: 149.99,
    paymentMethod: 'credit_card',
    quantity: 3,
    req: req,
    shippingCoordinates: {
        lat: 40.7128,
        lon: -74.0060
    }
});

// Example: Log failed payment
await logForensicEvent({
    userId: 123,
    sessionId: token,
    eventType: 'payment',
    eventStatus: 'failed',
    transactionAmount: 99.99,
    paymentMethod: 'paypal',
    req: req,
    errorMessage: 'Insufficient funds',
    isFraudulent: false,
    fraudScore: 25.5
});
```

### Querying Logs (API)

```bash
# Get recent logs
curl "http://localhost:4000/forensiclogs?limit=50"

# Filter by event type
curl "http://localhost:4000/forensiclogs?eventType=checkout&limit=100"

# Filter by user
curl "http://localhost:4000/forensiclogs?userId=123"

# Date range query
curl "http://localhost:4000/forensiclogs?startDate=2024-01-01&endDate=2024-12-31"

# Get fraud analytics
curl "http://localhost:4000/fraudanalytics"
```

### SQL Queries

```sql
-- Find all transactions by a user
SELECT * FROM forensic_logs 
WHERE user_id = 123 
ORDER BY timestamp DESC;

-- Detect suspicious patterns
SELECT user_id, COUNT(*) as failed_attempts
FROM forensic_logs
WHERE event_type = 'payment' 
AND event_status = 'failed'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY user_id
HAVING failed_attempts > 3;

-- Geographic analysis
SELECT ip_country_code, COUNT(*) as transactions, SUM(transaction_amount) as revenue
FROM forensic_logs
WHERE event_type = 'checkout'
GROUP BY ip_country_code
ORDER BY revenue DESC;

-- VPN detection
SELECT * FROM forensic_logs
WHERE vpn_proxy_status = 'detected'
AND event_type = 'checkout'
ORDER BY timestamp DESC;
```

## Fraud Detection Indicators

### High-Risk Signals

1. **VPN/Proxy Usage**
   - Status: `detected`
   - Risk: Medium-High
   - Action: Additional verification

2. **Large IP-Shipping Distance**
   - Distance: > 1000 km
   - Risk: Medium
   - Action: Verify shipping address

3. **Multiple Failed Payments**
   - Attempts: > 3
   - Risk: High
   - Action: Temporary account lock

4. **New Account, High Value**
   - Account age: < 7 days
   - Transaction: > $500
   - Risk: Medium-High
   - Action: Manual review

5. **Unusual Device/Location**
   - Different from historical pattern
   - Risk: Medium
   - Action: Email verification

### Fraud Score Calculation

The fraud score (0-100) is calculated based on:
- VPN/Proxy detection: +30 points
- Failed payment attempts: +10 points each
- IP-shipping distance: +1 point per 100km
- New account (<7 days): +20 points
- High transaction value: +10 points (>$500)
- Unusual time/location: +15 points

## Real-Time Monitoring

### Dashboard Metrics

Monitor these key metrics in real-time:

1. **Transaction Volume**
   - Transactions per minute
   - Success vs failure rate
   - Average transaction value

2. **Fraud Indicators**
   - VPN detection rate
   - Failed payment attempts
   - High-risk transactions

3. **User Behavior**
   - New vs returning customers
   - Cart abandonment rate
   - Device distribution

4. **Geographic Patterns**
   - Top countries by revenue
   - Suspicious locations
   - Distance anomalies

### Alerts Configuration

Set up alerts for:
- Fraud score > 70
- Failed payments > 5 in 1 hour
- VPN detected on high-value transaction
- Large IP-shipping distance (>2000km)
- Multiple accounts from same IP

## Performance Optimization

### Indexes

The schema includes optimized indexes:
```sql
INDEX idx_user_id (user_id)
INDEX idx_event_type (event_type)
INDEX idx_timestamp (timestamp)
INDEX idx_ip_address (ip_address)
INDEX idx_is_fraudulent (is_fraudulent)
INDEX idx_session_id (session_id)
```

### Query Optimization Tips

1. **Use date ranges** to limit result sets
2. **Filter by event_type** for specific analysis
3. **Use LIMIT** for large datasets
4. **Leverage indexes** in WHERE clauses
5. **Aggregate data** for reporting

### Data Retention

Recommended retention policy:
- **Hot data**: Last 30 days (fast queries)
- **Warm data**: 31-365 days (archived)
- **Cold data**: >365 days (compressed backup)

```sql
-- Archive old logs (run monthly)
CREATE TABLE forensic_logs_archive_2024 AS
SELECT * FROM forensic_logs
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 365 DAY);

DELETE FROM forensic_logs
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 365 DAY);
```

## Privacy & Compliance

### GDPR Compliance

1. **Data Minimization**: Only collect necessary data
2. **User Consent**: Inform users about logging
3. **Right to Access**: Provide user data on request
4. **Right to Erasure**: Delete user data on request

```sql
-- Delete user's forensic data
DELETE FROM forensic_logs WHERE user_id = ?;
```

### PCI DSS Compliance

- **Never log** full credit card numbers
- **Never log** CVV codes
- **Hash sensitive data** before logging
- **Encrypt** database at rest
- **Secure** database connections (SSL)

### Data Security

1. **Access Control**: Limit who can view logs
2. **Encryption**: Use TLS for data in transit
3. **Audit Trail**: Log access to forensic logs
4. **Regular Backups**: Automated daily backups
5. **Monitoring**: Alert on unusual access patterns

## Integration with Frontend

### Sending Context from Frontend

```javascript
// Include additional context in API calls
const response = await fetch('/addtocart', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'auth-token': userToken,
        'X-Session-ID': sessionId,
        'X-Device-ID': deviceId
    },
    body: JSON.stringify({
        productId: 123,
        quantity: 1,
        // Optional: shipping coordinates for distance calculation
        shippingLat: 40.7128,
        shippingLon: -74.0060
    })
});
```

## Troubleshooting

### Common Issues

1. **Logs not appearing**
   - Check database connection
   - Verify forensic_logs table exists
   - Check for errors in console

2. **Geolocation not working**
   - Ensure geoip-lite is installed
   - Update GeoIP database
   - Check IP address format

3. **Performance issues**
   - Add missing indexes
   - Implement data archiving
   - Use connection pooling

### Debug Mode

Enable detailed logging:
```javascript
// In forensicLogger.js
const DEBUG = process.env.FORENSIC_DEBUG === 'true';

if (DEBUG) {
    console.log('Forensic Event:', eventData);
}
```

## Best Practices

1. **Log Everything**: Better to have too much data than too little
2. **Async Logging**: Don't block user requests
3. **Error Handling**: Never let logging break the app
4. **Regular Analysis**: Review logs weekly
5. **Update Rules**: Adjust fraud detection based on patterns
6. **Test Thoroughly**: Verify logging in all scenarios
7. **Monitor Performance**: Track logging overhead
8. **Secure Access**: Protect forensic data
9. **Document Changes**: Keep this doc updated
10. **Train Team**: Ensure everyone understands the system

## Future Enhancements

Potential improvements:
- Machine learning fraud detection
- Real-time alerting system
- Visual analytics dashboard
- Automated response actions
- Integration with external fraud services
- Advanced device fingerprinting
- Behavioral biometrics
- Graph analysis for fraud rings

## Support

For questions or issues:
1. Check this documentation
2. Review SQL query examples
3. Check application logs
4. Test with sample data
5. Contact development team

-- Forensic Analytics Queries
-- Use these queries to analyze transaction patterns and detect fraud

-- ============================================
-- TRANSACTION ANALYSIS
-- ============================================

-- 1. Daily transaction summary
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(transaction_amount) as total_revenue,
    AVG(transaction_amount) as avg_transaction
FROM forensic_logs
WHERE event_type IN ('checkout', 'payment')
GROUP BY DATE(timestamp)
ORDER BY date DESC
LIMIT 30;

-- 2. Transaction by event type
SELECT 
    event_type,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(transaction_amount) as total_amount
FROM forensic_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY event_type
ORDER BY count DESC;

-- 3. Failed vs successful transactions
SELECT 
    event_type,
    event_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY event_type), 2) as percentage
FROM forensic_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY event_type, event_status
ORDER BY event_type, count DESC;

-- ============================================
-- FRAUD DETECTION
-- ============================================

-- 4. High-risk transactions (multiple fraud indicators)
SELECT 
    log_id,
    user_id,
    event_type,
    transaction_amount,
    vpn_proxy_status,
    failed_payment_attempts,
    distance_ip_shipping,
    fraud_score,
    timestamp
FROM forensic_logs
WHERE (
    vpn_proxy_status = 'detected' 
    OR failed_payment_attempts > 2
    OR distance_ip_shipping > 1000
    OR fraud_score > 70
)
AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY fraud_score DESC, timestamp DESC;

-- 5. Users with multiple failed payment attempts
SELECT 
    user_id,
    COUNT(*) as failed_attempts,
    MAX(timestamp) as last_attempt,
    GROUP_CONCAT(DISTINCT ip_address) as ip_addresses
FROM forensic_logs
WHERE event_type = 'payment' 
AND event_status = 'failed'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY user_id
HAVING failed_attempts > 3
ORDER BY failed_attempts DESC;

-- 6. Suspicious IP addresses (multiple users or high transaction volume)
SELECT 
    ip_address,
    ip_geolocation,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_transactions,
    SUM(transaction_amount) as total_amount,
    vpn_proxy_status
FROM forensic_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY ip_address, ip_geolocation, vpn_proxy_status
HAVING unique_users > 5 OR total_amount > 10000
ORDER BY unique_users DESC, total_amount DESC;

-- 7. Transactions with large IP-shipping distance
SELECT 
    log_id,
    user_id,
    event_type,
    transaction_amount,
    ip_geolocation,
    distance_ip_shipping,
    timestamp
FROM forensic_logs
WHERE distance_ip_shipping > 500
AND event_type = 'checkout'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY distance_ip_shipping DESC;

-- ============================================
-- USER BEHAVIOR ANALYSIS
-- ============================================

-- 8. New vs returning customers
SELECT 
    CASE 
        WHEN user_account_age_days <= 7 THEN 'New (0-7 days)'
        WHEN user_account_age_days <= 30 THEN 'Recent (8-30 days)'
        WHEN user_account_age_days <= 90 THEN 'Regular (31-90 days)'
        ELSE 'Loyal (90+ days)'
    END as customer_segment,
    COUNT(DISTINCT user_id) as users,
    COUNT(*) as transactions,
    AVG(transaction_amount) as avg_transaction,
    SUM(transaction_amount) as total_revenue
FROM forensic_logs
WHERE event_type = 'checkout'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY customer_segment
ORDER BY 
    CASE customer_segment
        WHEN 'New (0-7 days)' THEN 1
        WHEN 'Recent (8-30 days)' THEN 2
        WHEN 'Regular (31-90 days)' THEN 3
        ELSE 4
    END;

-- 9. Device usage patterns
SELECT 
    device_used,
    browser,
    COUNT(*) as sessions,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(transaction_amount) as avg_transaction
FROM forensic_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY device_used, browser
ORDER BY sessions DESC;

-- 10. Cart abandonment analysis
SELECT 
    DATE(timestamp) as date,
    SUM(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) as carts_created,
    SUM(CASE WHEN event_type = 'checkout' THEN 1 ELSE 0 END) as checkouts_completed,
    ROUND(
        SUM(CASE WHEN event_type = 'checkout' THEN 1 ELSE 0 END) * 100.0 / 
        NULLIF(SUM(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END), 0),
        2
    ) as conversion_rate
FROM forensic_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- ============================================
-- PRODUCT ANALYSIS
-- ============================================

-- 11. Most popular product categories
SELECT 
    product_category,
    COUNT(*) as views_or_purchases,
    SUM(CASE WHEN event_type = 'checkout' THEN 1 ELSE 0 END) as purchases,
    SUM(transaction_amount) as total_revenue,
    AVG(transaction_amount) as avg_price
FROM forensic_logs
WHERE product_category IS NOT NULL
AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY product_category
ORDER BY total_revenue DESC;

-- 12. Products frequently removed from cart
SELECT 
    product_id,
    COUNT(*) as removal_count,
    AVG(transaction_amount) as avg_price
FROM forensic_logs
WHERE event_type = 'remove_from_cart'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY product_id
ORDER BY removal_count DESC
LIMIT 20;

-- ============================================
-- GEOGRAPHIC ANALYSIS
-- ============================================

-- 13. Transactions by country
SELECT 
    ip_country_code,
    ip_geolocation,
    COUNT(*) as transactions,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(transaction_amount) as total_revenue,
    AVG(transaction_amount) as avg_transaction
FROM forensic_logs
WHERE event_type = 'checkout'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY ip_country_code, ip_geolocation
ORDER BY total_revenue DESC;

-- 14. VPN/Proxy usage by country
SELECT 
    ip_country_code,
    vpn_proxy_status,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users
FROM forensic_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY ip_country_code, vpn_proxy_status
HAVING vpn_proxy_status = 'detected'
ORDER BY count DESC;

-- ============================================
-- PAYMENT ANALYSIS
-- ============================================

-- 15. Payment method preferences
SELECT 
    payment_method,
    COUNT(*) as transactions,
    SUM(transaction_amount) as total_amount,
    AVG(transaction_amount) as avg_amount,
    SUM(CASE WHEN event_status = 'failed' THEN 1 ELSE 0 END) as failed_count,
    ROUND(
        SUM(CASE WHEN event_status = 'failed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) as failure_rate
FROM forensic_logs
WHERE payment_method IS NOT NULL
AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY payment_method
ORDER BY transactions DESC;

-- ============================================
-- TIME-BASED ANALYSIS
-- ============================================

-- 16. Peak transaction hours
SELECT 
    HOUR(timestamp) as hour,
    COUNT(*) as transactions,
    AVG(transaction_amount) as avg_amount,
    COUNT(DISTINCT user_id) as unique_users
FROM forensic_logs
WHERE event_type IN ('checkout', 'add_to_cart')
AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY HOUR(timestamp)
ORDER BY hour;

-- 17. Day of week patterns
SELECT 
    DAYNAME(timestamp) as day_of_week,
    COUNT(*) as transactions,
    SUM(transaction_amount) as total_revenue,
    AVG(transaction_amount) as avg_transaction
FROM forensic_logs
WHERE event_type = 'checkout'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DAYNAME(timestamp), DAYOFWEEK(timestamp)
ORDER BY DAYOFWEEK(timestamp);

-- ============================================
-- REAL-TIME MONITORING
-- ============================================

-- 18. Recent suspicious activities (last hour)
SELECT 
    log_id,
    user_id,
    event_type,
    event_status,
    transaction_amount,
    ip_address,
    vpn_proxy_status,
    failed_payment_attempts,
    timestamp
FROM forensic_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
AND (
    event_status = 'failed'
    OR vpn_proxy_status = 'detected'
    OR failed_payment_attempts > 0
)
ORDER BY timestamp DESC;

-- 19. Active sessions (last 15 minutes)
SELECT 
    session_id,
    user_id,
    COUNT(*) as events,
    MAX(timestamp) as last_activity,
    GROUP_CONCAT(DISTINCT event_type) as event_types
FROM forensic_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
GROUP BY session_id, user_id
ORDER BY last_activity DESC;

-- 20. Fraud score distribution
SELECT 
    CASE 
        WHEN fraud_score < 20 THEN 'Low (0-20)'
        WHEN fraud_score < 40 THEN 'Medium-Low (20-40)'
        WHEN fraud_score < 60 THEN 'Medium (40-60)'
        WHEN fraud_score < 80 THEN 'Medium-High (60-80)'
        ELSE 'High (80-100)'
    END as risk_level,
    COUNT(*) as count,
    AVG(transaction_amount) as avg_transaction
FROM forensic_logs
WHERE fraud_score > 0
AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY risk_level
ORDER BY 
    CASE risk_level
        WHEN 'Low (0-20)' THEN 1
        WHEN 'Medium-Low (20-40)' THEN 2
        WHEN 'Medium (40-60)' THEN 3
        WHEN 'Medium-High (60-80)' THEN 4
        ELSE 5
    END;

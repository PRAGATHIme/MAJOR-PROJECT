const db = require('../database/db');
const geoip = require('geoip-lite');

/**
 * Forensic Logger Middleware
 * Logs all transactions and user activities for fraud detection
 */

// Helper: Calculate user account age in days
const calculateAccountAge = (accountCreatedAt) => {
  if (!accountCreatedAt) return 0;
  const now = new Date();
  const created = new Date(accountCreatedAt);
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper: Get recent orders count
const getRecentOrdersCount = async (userId) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      [userId]
    );
    return rows[0].count;
  } catch (err) {
    console.error('Error getting recent orders:', err);
    return 0;
  }
};

// Helper: Detect device type from user agent
const detectDevice = (userAgent) => {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  return 'desktop';
};

// Helper: Extract browser from user agent
const extractBrowser = (userAgent) => {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  return 'Other';
};

// Helper: Simple VPN/Proxy detection (basic implementation)
const detectVpnProxy = (ip) => {
  // This is a basic implementation
  // For production, use services like IPQualityScore, MaxMind, etc.
  const knownVpnRanges = ['10.', '172.16.', '192.168.']; // Private IPs
  if (knownVpnRanges.some(range => ip.startsWith(range))) {
    return 'detected';
  }
  return 'not_detected';
};

// Helper: Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Main forensic logging function
 */
const logForensicEvent = async (eventData) => {
  try {
    const {
      userId,
      sessionId,
      orderId = null,
      productId = null,
      eventType,
      eventStatus = 'success',
      transactionAmount = 0,
      paymentMethod = null,
      productCategory = null,
      quantity = 1,
      req,
      shippingCoordinates = null,
      isFraudulent = false,
      fraudScore = 0,
      errorMessage = null
    } = eventData;

    // Extract request information
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || '';
    const referrer = req.get('referer') || '';

    // Get user information if userId provided
    let userAccountAgeDays = 0;
    let recentOrdersCount = 0;
    let failedPaymentAttempts = 0;

    if (userId) {
      const [userRows] = await db.query(
        'SELECT account_created_at, failed_login_attempts FROM users WHERE user_id = ?',
        [userId]
      );
      
      if (userRows.length > 0) {
        userAccountAgeDays = calculateAccountAge(userRows[0].account_created_at);
        failedPaymentAttempts = userRows[0].failed_login_attempts || 0;
      }
      
      recentOrdersCount = await getRecentOrdersCount(userId);
    }

    // Device and browser detection
    const deviceUsed = detectDevice(userAgent);
    const browser = extractBrowser(userAgent);

    // IP Geolocation
    const geo = geoip.lookup(ipAddress);
    let ipGeolocation = 'unknown';
    let ipCountryCode = 'unknown';
    let distanceIpShipping = null;

    if (geo) {
      ipGeolocation = `${geo.city || 'Unknown'}, ${geo.country || 'Unknown'}`;
      ipCountryCode = geo.country || 'unknown';

      // Calculate distance if shipping coordinates provided
      if (shippingCoordinates && geo.ll) {
        distanceIpShipping = calculateDistance(
          geo.ll[0], geo.ll[1],
          shippingCoordinates.lat, shippingCoordinates.lon
        );
      }
    }

    // VPN/Proxy detection
    const vpnProxyStatus = detectVpnProxy(ipAddress);

    // Insert log into database
    const query = `
      INSERT INTO forensic_logs (
        user_id, session_id, order_id, product_id,
        event_type, event_status,
        transaction_amount, payment_method, product_category, quantity,
        user_account_age_days, number_of_recent_orders, failed_payment_attempts,
        device_used, browser,
        ip_address, ip_geolocation, ip_country_code, distance_ip_shipping, vpn_proxy_status,
        is_fraudulent, fraud_score,
        user_agent, referrer_url, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId, sessionId, orderId, productId,
      eventType, eventStatus,
      transactionAmount, paymentMethod, productCategory, quantity,
      userAccountAgeDays, recentOrdersCount, failedPaymentAttempts,
      deviceUsed, browser,
      ipAddress, ipGeolocation, ipCountryCode, distanceIpShipping, vpnProxyStatus,
      isFraudulent, fraudScore,
      userAgent, referrer, errorMessage
    ];

    await db.query(query, values);
    console.log(`📝 Forensic log created: ${eventType} for user ${userId || 'guest'}`);
    
  } catch (err) {
    console.error('❌ Error logging forensic event:', err);
  }
};

module.exports = { logForensicEvent };

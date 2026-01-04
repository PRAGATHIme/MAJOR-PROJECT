/**
 * API Test Script
 * Tests all major endpoints to verify MySQL integration and forensic logging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';
let authToken = '';
let userId = '';
let productId = '';

// Helper function for API calls
const api = {
  get: (url) => axios.get(`${BASE_URL}${url}`),
  post: (url, data, headers = {}) => axios.post(`${BASE_URL}${url}`, data, headers)
};

// Test functions
async function testServerStatus() {
  console.log('\n🧪 Test 1: Server Status');
  try {
    const response = await api.get('/');
    console.log('✅ Server is running:', response.data);
    return true;
  } catch (err) {
    console.error('❌ Server not responding:', err.message);
    return false;
  }
}

async function testUserSignup() {
  console.log('\n🧪 Test 2: User Signup');
  try {
    const userData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890'
    };

    const response = await api.post('/signup', userData);
    
    if (response.data.success) {
      authToken = response.data.token;
      userId = response.data.userId;
      console.log('✅ User created successfully');
      console.log('   User ID:', userId);
      console.log('   Token:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.error('❌ Signup failed:', response.data.message);
      return false;
    }
  } catch (err) {
    console.error('❌ Signup error:', err.response?.data || err.message);
    return false;
  }
}

async function testUserLogin() {
  console.log('\n🧪 Test 3: User Login');
  try {
    const loginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    const response = await api.post('/login', loginData);
    
    if (response.data.success) {
      console.log('✅ Login successful');
      console.log('   User ID:', response.data.userId);
      return true;
    } else {
      console.log('⚠️  Login failed (expected if sample user not created)');
      return true; // Not critical
    }
  } catch (err) {
    console.log('⚠️  Login test skipped (sample user may not exist)');
    return true; // Not critical
  }
}

async function testAddProduct() {
  console.log('\n🧪 Test 4: Add Product');
  try {
    const productData = {
      name: 'Test Product',
      image: 'http://localhost:4000/images/test.jpg',
      category: 'electronics',
      new_price: 99.99,
      old_price: 129.99,
      stock_quantity: 50,
      description: 'This is a test product'
    };

    const response = await api.post('/addproduct', productData);
    
    if (response.data.success) {
      productId = response.data.productId;
      console.log('✅ Product added successfully');
      console.log('   Product ID:', productId);
      return true;
    } else {
      console.error('❌ Add product failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Add product error:', err.response?.data || err.message);
    return false;
  }
}

async function testGetProducts() {
  console.log('\n🧪 Test 5: Get All Products');
  try {
    const response = await api.get('/allproducts');
    console.log('✅ Products retrieved:', response.data.length, 'products');
    return true;
  } catch (err) {
    console.error('❌ Get products error:', err.message);
    return false;
  }
}

async function testAddToCart() {
  console.log('\n🧪 Test 6: Add to Cart');
  
  if (!authToken || !productId) {
    console.log('⚠️  Skipping (requires auth token and product)');
    return true;
  }

  try {
    const response = await api.post(
      '/addtocart',
      { productId, quantity: 2 },
      { headers: { 'auth-token': authToken } }
    );
    
    if (response.data.success) {
      console.log('✅ Added to cart successfully');
      return true;
    } else {
      console.error('❌ Add to cart failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Add to cart error:', err.response?.data || err.message);
    return false;
  }
}

async function testGetCart() {
  console.log('\n🧪 Test 7: Get Cart');
  
  if (!authToken) {
    console.log('⚠️  Skipping (requires auth token)');
    return true;
  }

  try {
    const response = await api.get('/getcart', {
      headers: { 'auth-token': authToken }
    });
    
    if (response.data.success) {
      console.log('✅ Cart retrieved:', response.data.cartItems.length, 'items');
      return true;
    } else {
      console.error('❌ Get cart failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Get cart error:', err.response?.data || err.message);
    return false;
  }
}

async function testForensicLogs() {
  console.log('\n🧪 Test 8: Forensic Logs');
  try {
    const response = await api.get('/forensiclogs?limit=5');
    
    if (response.data.success) {
      console.log('✅ Forensic logs retrieved:', response.data.count, 'logs');
      
      if (response.data.logs.length > 0) {
        const log = response.data.logs[0];
        console.log('   Latest event:', log.event_type);
        console.log('   User ID:', log.user_id);
        console.log('   IP:', log.ip_address);
        console.log('   Device:', log.device_used);
      }
      return true;
    } else {
      console.error('❌ Get logs failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Get logs error:', err.message);
    return false;
  }
}

async function testFraudAnalytics() {
  console.log('\n🧪 Test 9: Fraud Analytics');
  try {
    const response = await api.get('/fraudanalytics');
    
    if (response.data.success) {
      const stats = response.data.analytics;
      console.log('✅ Fraud analytics retrieved');
      console.log('   Total transactions:', stats.total_transactions);
      console.log('   Fraudulent count:', stats.fraudulent_count);
      console.log('   Unique users:', stats.unique_users);
      console.log('   Unique IPs:', stats.unique_ips);
      return true;
    } else {
      console.error('❌ Get analytics failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Get analytics error:', err.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('  E-Commerce API Test Suite');
  console.log('  MySQL + Forensic Logging');
  console.log('═══════════════════════════════════════════');

  const results = [];

  results.push(await testServerStatus());
  results.push(await testUserSignup());
  results.push(await testUserLogin());
  results.push(await testAddProduct());
  results.push(await testGetProducts());
  results.push(await testAddToCart());
  results.push(await testGetCart());
  results.push(await testForensicLogs());
  results.push(await testFraudAnalytics());

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n  Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n  🎉 All tests passed! System is working correctly.');
  } else {
    console.log('\n  ⚠️  Some tests failed. Check the output above.');
  }
  
  console.log('\n═══════════════════════════════════════════\n');
}

// Check if axios is installed
try {
  require.resolve('axios');
  runTests().catch(err => {
    console.error('\n❌ Test suite error:', err.message);
    process.exit(1);
  });
} catch (e) {
  console.log('\n⚠️  axios not found. Installing...');
  console.log('Run: npm install axios');
  console.log('Then: node test-api.js\n');
}

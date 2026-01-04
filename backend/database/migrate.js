/**
 * Migration Script: MongoDB to MySQL
 * This script migrates existing data from MongoDB to MySQL
 */

const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// MongoDB Connection
const MONGO_URI = 'mongodb://127.0.0.1:27017/ecommerce';

// MySQL Connection Config
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_db',
  multipleStatements: true
};

// MongoDB Product Schema
const Product = mongoose.model("Product", {
  id: Number,
  name: String,
  image: String,
  category: String,
  new_price: Number,
  old_price: Number,
  available: Boolean,
  date: Date,
});

async function migrateProducts(mysqlConnection) {
  console.log('\n📦 Migrating Products...');
  
  try {
    const products = await Product.find({});
    console.log(`Found ${products.length} products in MongoDB`);

    for (const product of products) {
      await mysqlConnection.query(
        `INSERT INTO products (name, image, category, new_price, old_price, available, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [
          product.name,
          product.image,
          product.category,
          product.new_price,
          product.old_price,
          product.available !== false,
          product.date || new Date()
        ]
      );
    }

    console.log(`✅ Migrated ${products.length} products successfully`);
  } catch (err) {
    console.error('❌ Error migrating products:', err.message);
  }
}

async function createSampleUsers(mysqlConnection) {
  console.log('\n👤 Creating sample users...');
  
  try {
    const sampleUsers = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567891'
      }
    ];

    for (const user of sampleUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      await mysqlConnection.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, phone) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE username = VALUES(username)`,
        [user.username, user.email, passwordHash, user.firstName, user.lastName, user.phone]
      );
    }

    console.log(`✅ Created ${sampleUsers.length} sample users`);
    console.log('   Email: john@example.com / jane@example.com');
    console.log('   Password: password123');
  } catch (err) {
    console.error('❌ Error creating users:', err.message);
  }
}

async function runMigration() {
  let mysqlConnection;
  
  try {
    console.log('🚀 Starting Migration Process...\n');

    // Connect to MySQL
    console.log('📊 Connecting to MySQL...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL Connected');

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Run migrations
    await migrateProducts(mysqlConnection);
    await createSampleUsers(mysqlConnection);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your .env file with MySQL credentials');
    console.log('   2. Run: npm run start:mysql');
    console.log('   3. Test the API endpoints');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    // Close connections
    if (mysqlConnection) await mysqlConnection.end();
    await mongoose.disconnect();
    console.log('\n🔌 Connections closed');
    process.exit(0);
  }
}

// Run migration
runMigration();

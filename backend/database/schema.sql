-- E-Commerce Database Schema with Forensic Logging
-- MySQL Database Schema

CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    account_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    new_price DECIMAL(10, 2) NOT NULL,
    old_price DECIMAL(10, 2),
    available BOOLEAN DEFAULT TRUE,
    stock_quantity INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_available (available)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipping_address TEXT,
    order_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_order_status (order_status),
    INDEX idx_created_at (created_at)
);

-- Forensic Logs Table
CREATE TABLE IF NOT EXISTS forensic_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Transaction Identifiers
    user_id INT,
    session_id VARCHAR(255),
    order_id INT NULL,
    product_id INT NULL,
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL, -- 'add_to_cart', 'remove_from_cart', 'checkout', 'payment', 'view_product', etc.
    event_status VARCHAR(50) DEFAULT 'success', -- 'success', 'failed', 'pending'
    
    -- Transaction Features
    transaction_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    product_category VARCHAR(100),
    quantity INT DEFAULT 1,
    
    -- User Behavior Features
    user_account_age_days INT, -- Calculated: days since account creation
    number_of_recent_orders INT DEFAULT 0, -- Orders in last 30 days
    failed_payment_attempts INT DEFAULT 0,
    device_used VARCHAR(100), -- 'mobile', 'desktop', 'tablet'
    browser VARCHAR(100),
    
    -- Network/Location Features
    ip_address VARCHAR(45), -- IPv4 or IPv6
    ip_geolocation VARCHAR(255), -- City, Country
    ip_country_code VARCHAR(10),
    distance_ip_shipping DECIMAL(10, 2), -- Distance in km
    vpn_proxy_status VARCHAR(50), -- 'detected', 'not_detected', 'unknown'
    
    -- Target Label (for fraud detection)
    is_fraudulent BOOLEAN DEFAULT FALSE,
    fraud_score DECIMAL(5, 2), -- 0.00 to 100.00
    
    -- Additional Metadata
    user_agent TEXT,
    referrer_url VARCHAR(500),
    request_payload JSON,
    response_payload JSON,
    error_message TEXT,
    
    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_fraudulent (is_fraudulent),
    INDEX idx_session_id (session_id),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

-- Cart Items Table (for tracking active carts)
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user_id (user_id)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id)
);

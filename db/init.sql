-- Each microservice owns its own database (microservice best practice:
-- no service reaches directly into another service's tables).

-- ===================== user-service =====================
CREATE DATABASE IF NOT EXISTS userdb;
USE userdb;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== product-service =====================
CREATE DATABASE IF NOT EXISTS productdb;
USE productdb;

CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cuisine VARCHAR(255) NOT NULL,
    rating DECIMAL(2,1) NOT NULL DEFAULT 4.0,
    delivery_time_mins INT NOT NULL DEFAULT 30,
    image_color VARCHAR(16) NOT NULL DEFAULT '#e11d48'
);

CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

INSERT INTO restaurants (name, cuisine, rating, delivery_time_mins, image_color) VALUES
    ('Spice Route', 'North Indian', 4.3, 35, '#e11d48'),
    ('Pizza Point', 'Italian', 4.1, 28, '#f59e0b'),
    ('Dragon Wok', 'Chinese', 4.4, 32, '#059669'),
    ('Burger Barn', 'American', 4.0, 22, '#2563eb');

INSERT INTO menu_items (restaurant_id, name, description, price, is_veg) VALUES
    (1, 'Paneer Butter Masala', 'Cottage cheese in a creamy tomato gravy', 220.00, TRUE),
    (1, 'Chicken Biryani', 'Fragrant basmati rice with spiced chicken', 280.00, FALSE),
    (1, 'Dal Makhani', 'Slow-cooked black lentils with butter and cream', 180.00, TRUE),
    (2, 'Margherita Pizza', 'Classic tomato, mozzarella, and basil', 250.00, TRUE),
    (2, 'Pepperoni Pizza', 'Loaded with pepperoni and mozzarella', 320.00, FALSE),
    (2, 'Garlic Breadsticks', 'Warm breadsticks with garlic butter', 120.00, TRUE),
    (3, 'Veg Hakka Noodles', 'Stir-fried noodles with mixed vegetables', 190.00, TRUE),
    (3, 'Kung Pao Chicken', 'Spicy stir-fried chicken with peanuts', 260.00, FALSE),
    (3, 'Spring Rolls', 'Crispy rolls with vegetable filling', 150.00, TRUE),
    (4, 'Classic Cheeseburger', 'Beef patty, cheddar, lettuce, tomato', 210.00, FALSE),
    (4, 'Veggie Burger', 'Grilled veggie patty with special sauce', 190.00, TRUE),
    (4, 'Loaded Fries', 'Fries topped with cheese and jalapenos', 160.00, TRUE);

-- ===================== order-service =====================
CREATE DATABASE IF NOT EXISTS orderdb;
USE orderdb;

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    restaurant_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PLACED',
    total DECIMAL(10,2) NOT NULL,
    delivery_address VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

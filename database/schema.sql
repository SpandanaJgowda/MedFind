-- MediFind Database Schema (MySQL)
-- Intelligent Medicine Discovery & Reservation Platform

CREATE DATABASE IF NOT EXISTS medifind_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medifind_db;

-- 1. Users table (Patients, Pharmacy Owners, Administrators)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('patient', 'pharmacy_owner', 'admin') NOT NULL DEFAULT 'patient',
    phone VARCHAR(30),
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Pharmacies table
CREATE TABLE IF NOT EXISTS pharmacies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    opening_hours VARCHAR(100) DEFAULT '08:00 AM - 10:00 PM',
    reservation_hold_hours INT UNSIGNED NOT NULL DEFAULT 24,
    approval_status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pharmacy_city (city),
    INDEX idx_pharmacy_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'Pill',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Medicines table (Global Catalog)
CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    brand_name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    active_ingredient VARCHAR(200) NOT NULL,
    strength VARCHAR(50) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    category_id INT NULL,
    prescription_required BOOLEAN DEFAULT FALSE,
    description TEXT,
    usage_instructions TEXT,
    side_effects TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_med_name (name),
    INDEX idx_med_brand (brand_name),
    INDEX idx_med_generic (generic_name),
    INDEX idx_med_ingredient (active_ingredient),
    INDEX idx_med_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Pharmacy Inventory table
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_id INT NOT NULL,
    medicine_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    min_stock_level INT NOT NULL DEFAULT 5,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pharmacy_medicine (pharmacy_id, medicine_id),
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    INDEX idx_inventory_qty (quantity),
    INDEX idx_inventory_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Patient prescriptions (stored privately by the API, never served as static files)
CREATE TABLE IF NOT EXISTS prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    pharmacy_id INT NOT NULL,
    medicine_id INT NOT NULL,
    storage_key VARCHAR(100) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status ENUM('Pending', 'Verified', 'Rejected') NOT NULL DEFAULT 'Pending',
    review_notes TEXT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    INDEX idx_prescription_patient (patient_id),
    INDEX idx_prescription_pharmacy (pharmacy_id),
    INDEX idx_prescription_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_code VARCHAR(30) NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    pharmacy_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Ready for Pickup', 'Completed', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    patient_notes TEXT,
    pharmacy_notes TEXT,
    prescription_id INT NULL,
    hold_duration_hours INT UNSIGNED NULL,
    cancellation_reason VARCHAR(255) NULL,
    reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    pickup_deadline DATETIME NULL,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL,
    INDEX idx_res_code (reservation_code),
    INDEX idx_res_patient (patient_id),
    INDEX idx_res_pharmacy (pharmacy_id),
    INDEX idx_res_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Medicine procurement requests
CREATE TABLE IF NOT EXISTS procurement_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_code VARCHAR(30) NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    pharmacy_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    status ENUM('Pending', 'Accepted', 'Rejected', 'Ordered', 'Delayed', 'Ready for Pickup', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    patient_notes TEXT NULL,
    pharmacy_notes TEXT NULL,
    estimated_arrival DATETIME NULL,
    expected_price DECIMAL(10, 2) NULL,
    hold_duration_hours INT UNSIGNED NOT NULL DEFAULT 24,
    pickup_deadline DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    INDEX idx_procurement_patient (patient_id),
    INDEX idx_procurement_pharmacy (pharmacy_id),
    INDEX idx_procurement_status (status),
    INDEX idx_procurement_deadline (pickup_deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. In-app workflow notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_user_created (user_id, created_at),
    INDEX idx_notification_unread (user_id, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Search Logs table (for intelligent suggestions, search history and analytics)
CREATE TABLE IF NOT EXISTS search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NULL,
    query VARCHAR(255) NOT NULL,
    category VARCHAR(100) NULL,
    results_count INT DEFAULT 0,
    searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_search_query (query),
    INDEX idx_search_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

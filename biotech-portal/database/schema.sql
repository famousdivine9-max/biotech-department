-- ============================================================
-- BIOTECHNOLOGY DEPARTMENT PORTAL - DATABASE SCHEMA
-- Federal University Lokoja
-- ============================================================

CREATE DATABASE IF NOT EXISTS biotech_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE biotech_portal;

-- ============================================================
-- ADMINS TABLE
-- ============================================================
CREATE TABLE admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin') DEFAULT 'admin',
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- ============================================================
-- ACADEMIC SESSIONS TABLE
-- ============================================================
CREATE TABLE academic_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_name VARCHAR(20) NOT NULL UNIQUE COMMENT 'e.g. 2023/2024',
  is_current TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- SEMESTERS TABLE
-- ============================================================
CREATE TABLE semesters (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g. First Semester, Second Semester',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- LEVELS TABLE
-- ============================================================
CREATE TABLE levels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE COMMENT 'e.g. 100 Level, 200 Level',
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- COURSES TABLE
-- ============================================================
CREATE TABLE courses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL UNIQUE,
  course_title VARCHAR(200) NOT NULL,
  level_id INT UNSIGNED NULL,
  semester_id INT UNSIGNED NULL,
  credit_units INT DEFAULT 2,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
  INDEX idx_course_code (course_code)
);

-- ============================================================
-- LECTURERS TABLE
-- ============================================================
CREATE TABLE lecturers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  staff_id VARCHAR(50) NOT NULL UNIQUE,
  department VARCHAR(150) DEFAULT 'Biotechnology',
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
  approved_by INT UNSIGNED NULL,
  approved_at DATETIME NULL,
  profile_photo VARCHAR(500) NULL,
  bio TEXT NULL,
  last_login DATETIME NULL,
  password_reset_token VARCHAR(255) NULL,
  password_reset_expires DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_staff_id (staff_id),
  INDEX idx_status (status)
);

-- ============================================================
-- LECTURER APPROVALS LOG
-- ============================================================
CREATE TABLE lecturer_approvals (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lecturer_id INT UNSIGNED NOT NULL,
  admin_id INT UNSIGNED NOT NULL,
  action ENUM('approved', 'rejected', 'suspended', 'reactivated') NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_lecturer (lecturer_id)
);

-- ============================================================
-- MATERIALS TABLE
-- ============================================================
CREATE TABLE materials (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lecturer_id INT UNSIGNED NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT NULL,
  course_code VARCHAR(20) NOT NULL,
  course_id INT UNSIGNED NULL,
  level_id INT UNSIGNED NULL,
  semester_id INT UNSIGNED NULL,
  session_id INT UNSIGNED NULL,
  file_url VARCHAR(1000) NOT NULL,
  file_public_id VARCHAR(500) NULL COMMENT 'Cloudinary public_id or S3 key',
  file_size BIGINT UNSIGNED DEFAULT 0 COMMENT 'File size in bytes',
  file_name VARCHAR(500) NOT NULL,
  download_count INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
  FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE SET NULL,
  INDEX idx_course_code (course_code),
  INDEX idx_lecturer (lecturer_id),
  INDEX idx_level (level_id),
  FULLTEXT INDEX ft_title_desc (title, description)
);

-- ============================================================
-- MATERIAL DOWNLOADS TABLE
-- ============================================================
CREATE TABLE material_downloads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  material_id INT UNSIGNED NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  INDEX idx_material (material_id),
  INDEX idx_downloaded_at (downloaded_at)
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  matric_number VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  level VARCHAR(30) NOT NULL,
  department VARCHAR(150) DEFAULT 'Biotechnology',
  session_id INT UNSIGNED NULL,
  academic_session VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  dues_amount DECIMAL(10,2) NOT NULL,
  processing_fee DECIMAL(10,2) NOT NULL,
  paystack_reference VARCHAR(200) NOT NULL UNIQUE,
  paystack_transaction_id VARCHAR(200) NULL,
  payment_status ENUM('pending', 'successful', 'failed', 'abandoned') DEFAULT 'pending',
  payment_channel VARCHAR(50) NULL COMMENT 'card, bank_transfer, ussd etc.',
  payment_date DATETIME NULL,
  ip_address VARCHAR(45) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE SET NULL,
  INDEX idx_matric (matric_number),
  INDEX idx_status (payment_status),
  INDEX idx_reference (paystack_reference),
  INDEX idx_session (academic_session),
  INDEX idx_payment_date (payment_date)
);

-- ============================================================
-- RECEIPTS TABLE
-- ============================================================
CREATE TABLE receipts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id INT UNSIGNED NOT NULL UNIQUE,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  matric_number VARCHAR(50) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  academic_session VARCHAR(20) NOT NULL,
  level VARCHAR(30) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_reference VARCHAR(200) NOT NULL,
  transaction_id VARCHAR(200) NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reissued_count INT DEFAULT 0,
  last_reissued_at DATETIME NULL,
  is_valid TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  INDEX idx_receipt_number (receipt_number),
  INDEX idx_matric (matric_number),
  INDEX idx_reference (payment_reference)
);

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE announcements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  admin_id INT UNSIGNED NULL,
  is_published TINYINT(1) DEFAULT 0,
  published_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_published (is_published, published_at)
);

-- ============================================================
-- SETTINGS TABLE
-- ============================================================
CREATE TABLE settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NULL,
  setting_type ENUM('text', 'number', 'image', 'boolean', 'json') DEFAULT 'text',
  description VARCHAR(300) NULL,
  updated_by INT UNSIGNED NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_key (setting_key)
);

-- ============================================================
-- ACTIVITY LOG TABLE
-- ============================================================
CREATE TABLE activity_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_type ENUM('admin', 'lecturer', 'student', 'system') NOT NULL,
  actor_id INT UNSIGNED NULL,
  actor_name VARCHAR(150) NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT NULL,
  ip_address VARCHAR(45) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actor (actor_type, actor_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);

-- ============================================================
-- DEFAULT DATA INSERTS
-- ============================================================

-- Default Admin (password: Admin@123 - change immediately)
INSERT INTO admins (full_name, email, password_hash, role) VALUES
('Super Administrator', 'admin@biotechfulokoja.edu.ng', '$2b$12$placeholder_change_this_on_first_login', 'super_admin');

-- Default Semesters
INSERT INTO semesters (name) VALUES ('First Semester'), ('Second Semester');

-- Default Levels
INSERT INTO levels (name, sort_order) VALUES
('100 Level', 1), ('200 Level', 2), ('300 Level', 3), ('400 Level', 4), ('500 Level', 5);

-- Default Academic Session
INSERT INTO academic_sessions (session_name, is_current) VALUES ('2024/2025', 1);

-- Default Settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', 'Biotechnology Department Portal', 'text', 'Name of the portal'),
('department_name', 'Department of Biotechnology', 'text', 'Full department name'),
('faculty_name', 'Faculty of Life Sciences', 'text', 'Full faculty name'),
('university_name', 'Federal University Lokoja', 'text', 'University name'),
('contact_email', 'biotech@fulokoja.edu.ng', 'text', 'Contact email address'),
('contact_phone', '+234 000 000 0000', 'text', 'Contact phone number'),
('office_address', 'Faculty of Life Sciences, Federal University Lokoja, Lokoja, Kogi State', 'text', 'Office address'),
('departmental_dues', '2000', 'number', 'Amount for departmental dues in Naira'),
('processing_fee', '100', 'number', 'Receipt processing fee in Naira'),
('department_logo', '', 'image', 'Department logo URL'),
('faculty_logo', '', 'image', 'Faculty logo URL'),
('homepage_banner', '', 'image', 'Homepage banner image URL'),
('favicon', '', 'image', 'Website favicon URL'),
('paystack_public_key', '', 'text', 'Paystack public key'),
('max_upload_size_mb', '50', 'number', 'Maximum file upload size in MB'),
('site_maintenance', 'false', 'boolean', 'Enable maintenance mode');

-- Sample Courses
INSERT INTO courses (course_code, course_title, level_id, semester_id) VALUES
('BIO 101', 'General Biology I', 1, 1),
('BIO 102', 'General Biology II', 1, 2),
('BCH 201', 'Biochemistry I', 2, 1),
('BCH 202', 'Biochemistry II', 2, 2),
('BTH 301', 'Biotechnology Principles', 3, 1),
('BTH 302', 'Molecular Biology', 3, 2),
('BTH 401', 'Genetic Engineering', 4, 1),
('BTH 402', 'Bioprocess Technology', 4, 2);

-- Active: 1769860933004@@139.196.44.6@3306@church_db
-- Active: 1769860933004@@139.196.44.6@3306@church_db@139.196.44.6@3306@church_db@139.196.44.6@3306
CREATE DATABASE church_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

mysql -u church_user -p -h 127.0.0.1 church_db
CREATE USER 'church_user'@'%' IDENTIFIED BY 'App@2026#Pwd';

GRANT ALL PRIVILEGES ON church_db.* TO 'church_user'@'%';
USE church_db;

CREATE USER 'root'@'153.239.43.%' IDENTIFIED BY '6586156';
CREATE USER 'church_user'@'153.239.43.%' IDENTIFIED BY '强密码';

GRANT ALL PRIVILEGES ON app_db.* TO 'app_user'@'153.239.43.%';

ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(10) AFTER name;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS age INT AFTER gender;
INSERT INTO companies (name, code) VALUES ('Demo Company', 'demo001');
SELECT id FROM companies WHERE code='demo001';
INSERT INTO admins (username, password, company_id)
VALUES ('admin', '$2a$10$1Q0kiq.bm54DKlFGCKbI9OY02to.2c1lndv2IbIaBO4A4EtYhvZzC', 1);
INSERT INTO employees (company_id,name,gender,age,phone,address)
VALUES (1,'Alice','女',30,'13800000000','测试地址');
SHOW COLUMNS FROM employees;
SELECT * FROM attendance LIMIT 10;
SELECT * FROM employees LIMIT 10;
SELECT * FROM companies LIMIT 10;
DELETE FROM companies WHERE id=1 OR id=2 OR id=3;
FLUSH PRIVILEGES;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(10) AFTER name;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS age INT AFTER gender;

CREATE TABLE companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  code VARCHAR(50) UNIQUE
);

CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50),
  password VARCHAR(255),
  company_id INT
);

CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT,
  name VARCHAR(50),
  gender VARCHAR(10),
  age INT,
  phone VARCHAR(20),
  address VARCHAR(255)
);

CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT,
  company_id INT,
  sign_date DATE,
  sign_time DATETIME,
  sign_ip VARCHAR(50),
  UNIQUE(employee_id, sign_date)
);

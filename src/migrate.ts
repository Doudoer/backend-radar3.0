import pool from './config/db.js';
import { hashPassword } from './services/password.service.js';

async function columnExists(table: string, column: string) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
  return Array.isArray(rows) && rows.length > 0;
}

async function ensureColumn(table: string, definition: string, column: string) {
  if (!(await columnExists(table, column))) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

async function runMigrations() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'visor',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    permissions TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(150),
    address_shipping VARCHAR(255),
    zip_code VARCHAR(30),
    notes TEXT,
    company VARCHAR(150),
    name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50),
    customer_email VARCHAR(150),
    vin_nr VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    sub_model VARCHAR(100),
    year INT NULL,
    color VARCHAR(50),
    stock_nr VARCHAR(50),
    product_type VARCHAR(100),
    product_specs TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Cotización',
    shipping_toggle TINYINT(1) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    warranty_days INT NOT NULL DEFAULT 30,
    description TEXT,
    shipping_address TEXT,
    claim_reason TEXT,
    core_status VARCHAR(100),
    workflow_step INT NOT NULL DEFAULT 1,
    prorogation_until DATETIME NULL,
    scheduled_pickup_at DATETIME NULL,
    delivered_at DATETIME NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    claim_code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    assigned_user_id INT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Emitida',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS warranties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    claim_code VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    priority VARCHAR(20) NOT NULL DEFAULT 'low',
    link VARCHAR(255),
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(50) NOT NULL,
    contact_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    is_claim TINYINT(1) NOT NULL DEFAULT 0,
    customer_id INT NULL,
    order_id INT NULL,
    user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_code VARCHAR(100) NOT NULL UNIQUE,
    driver_id INT NULL,
    driver_name VARCHAR(150) NULL,
    receiver_name VARCHAR(150) NOT NULL,
    delivery_address TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    order_ids TEXT,
    order_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS logistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    operator_id INT NULL,
    operator_name VARCHAR(150) NULL,
    language VARCHAR(20) NOT NULL DEFAULT 'es',
    secure_hash VARCHAR(120) NOT NULL UNIQUE,
    order_ids TEXT,
    item_count INT NOT NULL DEFAULT 0,
    found_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS logistics_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    logistics_id INT NOT NULL,
    order_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS order_customer_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    message TEXT NOT NULL,
    contact_channel VARCHAR(100),
    contact_reason VARCHAR(150),
    contact_result VARCHAR(150),
    customer_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS order_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS ai_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    week_start DATE NULL,
    week_end DATE NULL,
    model VARCHAR(100) NULL,
    payload LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(512) NOT NULL,
    size INT NOT NULL DEFAULT 0,
    metadata LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await ensureColumn('users', 'permissions TEXT NULL', 'permissions');

  await ensureColumn('customers', 'first_name VARCHAR(100) NOT NULL DEFAULT ""', 'first_name');
  await ensureColumn('customers', 'last_name VARCHAR(100) NOT NULL DEFAULT ""', 'last_name');
  await ensureColumn('customers', 'whatsapp VARCHAR(50) NULL', 'whatsapp');
  await ensureColumn('customers', 'address_shipping VARCHAR(255) NULL', 'address_shipping');
  await ensureColumn('customers', 'zip_code VARCHAR(30) NULL', 'zip_code');
  await ensureColumn('customers', 'notes TEXT NULL', 'notes');

  await ensureColumn('orders', 'customer_id INT NULL', 'customer_id');
  await ensureColumn('orders', 'vin_nr VARCHAR(50) NULL', 'vin_nr');
  await ensureColumn('orders', 'sub_model VARCHAR(100) NULL', 'sub_model');
  await ensureColumn('orders', 'color VARCHAR(50) NULL', 'color');
  await ensureColumn('orders', 'stock_nr VARCHAR(50) NULL', 'stock_nr');
  await ensureColumn('orders', 'year INT NULL', 'year');
  await ensureColumn('orders', 'product_type VARCHAR(100) NULL', 'product_type');
  await ensureColumn('orders', 'product_specs TEXT NULL', 'product_specs');
  await ensureColumn('orders', 'shipping_toggle TINYINT(1) NOT NULL DEFAULT 0', 'shipping_toggle');
  await ensureColumn('orders', 'shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00', 'shipping_cost');
  await ensureColumn('orders', 'warranty_days INT NOT NULL DEFAULT 30', 'warranty_days');
  await ensureColumn('orders', 'description TEXT NULL', 'description');
  await ensureColumn('orders', 'shipping_address TEXT NULL', 'shipping_address');
  await ensureColumn('orders', 'claim_reason TEXT NULL', 'claim_reason');
  await ensureColumn('orders', 'core_status VARCHAR(100) NULL', 'core_status');
  await ensureColumn('orders', 'workflow_step INT NOT NULL DEFAULT 1', 'workflow_step');
  await ensureColumn('orders', 'prorogation_until DATETIME NULL', 'prorogation_until');
  await ensureColumn('orders', 'scheduled_pickup_at DATETIME NULL', 'scheduled_pickup_at');
  await ensureColumn('orders', 'delivered_at DATETIME NULL', 'delivered_at');

  await ensureColumn('claims', 'description TEXT NULL', 'description');
  await ensureColumn('claims', 'assigned_user_id INT NULL', 'assigned_user_id');

  await ensureColumn('notifications', 'priority VARCHAR(20) NOT NULL DEFAULT "low"', 'priority');
  await ensureColumn('notifications', 'link VARCHAR(255) NULL', 'link');
  await ensureColumn('notifications', 'is_read TINYINT(1) NOT NULL DEFAULT 0', 'is_read');

  const hashedPassword = await hashPassword('123456');

  await pool.query(
    `INSERT INTO users (name, email, password, role, active, permissions)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password = VALUES(password),
       role = VALUES(role),
       active = VALUES(active),
       permissions = VALUES(permissions)`,
    ['Administrador Radar', 'admin@radar.com', hashedPassword, 'admin', true, JSON.stringify(['can_edit_orders', 'can_delete_orders', 'can_manage_claims', 'can_manage_users', 'can_view_financials', 'can_export_reports'])],
  );

  await pool.query(`INSERT IGNORE INTO orders (order_number, customer_name, customer_phone, customer_email, brand, model, status, total_amount)
    VALUES
      ('ORD-1001', 'María González', '987654321', 'maria@example.com', 'Samsung', 'A54', 'Cotización', 125000.00),
      ('ORD-1002', 'Carlos Rojas', '912345678', 'carlos@example.com', 'Apple', 'iPhone 15', 'En Preparación', 98000.00),
      ('ORD-1003', 'Ana Torres', '987123456', 'ana@example.com', 'Xiaomi', '13T', 'Entregado', 150000.00)`);

  await pool.query(`INSERT IGNORE INTO customers (first_name, last_name, phone, whatsapp, email, address_shipping, zip_code, notes, company, name)
    VALUES
      ('María', 'González', '987654321', '987654321', 'maria@example.com', 'Sopra', '10101', 'Cliente semilla', 'Sopra', 'María González'),
      ('Carlos', 'Rojas', '912345678', '912345678', 'carlos@example.com', 'Nexa', '10102', 'Cliente semilla', 'Nexa', 'Carlos Rojas'),
      ('Ana', 'Torres', '987123456', '987123456', 'ana@example.com', 'Mediapp', '10103', 'Cliente semilla', 'Mediapp', 'Ana Torres')`);

  await pool.query(`INSERT IGNORE INTO warranties (order_id, claim_code, status)
    VALUES (1, 'GAR-1001', 'Pendiente'), (2, 'GAR-1002', 'Procesando')`);

  await pool.query(`INSERT IGNORE INTO invoices (order_id, invoice_number, amount, status)
    VALUES (1, 'FAC-1001', 125000.00, 'Emitida'), (2, 'FAC-1002', 98000.00, 'Pendiente')`);

  await pool.query(`INSERT IGNORE INTO claims (order_id, claim_code, status, description)
    VALUES (1, 'REC-1001', 'Pending', 'Reclamo semilla'), (2, 'REC-1002', 'In Process', 'Reclamo semilla')`);

  await pool.query(`INSERT IGNORE INTO notifications (title, message, type, priority, link, is_read)
    VALUES
      ('Orden lista', 'La orden ORD-1002 ya está lista para entrega.', 'order_ready', 'medium', '/orders', 0),
      ('Reclamo pendiente', 'Se requiere seguimiento del reclamo REC-1001.', 'pending_claim', 'high', '/claims', 0)`);

  console.log('Migraciones aplicadas correctamente');
}

runMigrations().finally(() => {
  process.exit(0);
});

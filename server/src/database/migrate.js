const db = require('../config/db');

const tableDefinitions = [
  `CREATE TABLE IF NOT EXISTS prescriptions (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS procurement_requests (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS notifications (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

async function ensureColumn(table, column, definition) {
  const rows = await db.query(
    'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  if (rows.length === 0) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function migrate() {
  await ensureColumn('pharmacies', 'reservation_hold_hours', 'INT UNSIGNED NOT NULL DEFAULT 24');
  await ensureColumn('pharmacy_inventory', 'reserved_quantity', 'INT UNSIGNED NOT NULL DEFAULT 0');
  await ensureColumn('reservations', 'prescription_id', 'INT NULL');
  await ensureColumn('reservations', 'hold_duration_hours', 'INT UNSIGNED NULL');
  await ensureColumn('reservations', 'cancellation_reason', 'VARCHAR(255) NULL');

  for (const definition of tableDefinitions) {
    await db.query(definition);
  }

  await db.query(`
    UPDATE reservations r
    JOIN pharmacies p ON p.id = r.pharmacy_id
    SET r.hold_duration_hours = COALESCE(r.hold_duration_hours, p.reservation_hold_hours, 24),
        r.pickup_deadline = DATE_ADD(
          COALESCE(r.status_updated_at, r.reserved_at),
          INTERVAL COALESCE(r.hold_duration_hours, p.reservation_hold_hours, 24) HOUR
        )
    WHERE r.status IN ('Confirmed', 'Ready for Pickup') AND r.pickup_deadline IS NULL
  `);

  await db.query(`
    UPDATE pharmacy_inventory pi
    LEFT JOIN (
      SELECT pharmacy_id, medicine_id, SUM(held_quantity) AS held_quantity
      FROM (
        SELECT pharmacy_id, medicine_id, SUM(quantity) AS held_quantity
        FROM reservations
        WHERE status IN ('Confirmed', 'Ready for Pickup')
          AND pickup_deadline IS NOT NULL AND pickup_deadline > NOW()
        GROUP BY pharmacy_id, medicine_id
        UNION ALL
        SELECT pharmacy_id, medicine_id, SUM(quantity) AS held_quantity
        FROM procurement_requests
        WHERE status = 'Ready for Pickup'
          AND pickup_deadline IS NOT NULL AND pickup_deadline > NOW()
        GROUP BY pharmacy_id, medicine_id
      ) active_holds
      GROUP BY pharmacy_id, medicine_id
    ) holds ON holds.pharmacy_id = pi.pharmacy_id AND holds.medicine_id = pi.medicine_id
    SET pi.reserved_quantity = LEAST(pi.quantity, COALESCE(holds.held_quantity, 0))
  `);

  console.log('MediFind database migrations completed.');
}

if (require.main === module) {
  migrate()
    .then(() => db.getPool().end())
    .catch(async (error) => {
      console.error('MediFind database migration failed:', error);
      await db.getPool().end();
      process.exitCode = 1;
    });
}

module.exports = migrate;
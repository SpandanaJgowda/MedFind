const db = require('../config/db');

// 1. Admin Dashboard Statistics
async function getAdminDashboardStats(req, res) {
  try {
    // Total Patients
    const [patientRow] = await db.query("SELECT COUNT(*) AS total_patients FROM users WHERE role = 'patient'");
    // Total Pharmacies
    const [pharmRow] = await db.query(`
      SELECT 
        COUNT(*) AS total_pharmacies,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) AS approved_pharmacies,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) AS pending_approvals,
        SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) AS rejected_pharmacies,
        SUM(CASE WHEN approval_status = 'suspended' THEN 1 ELSE 0 END) AS suspended_pharmacies
      FROM pharmacies
    `);
    // Total Medicines
    const [medRow] = await db.query('SELECT COUNT(*) AS total_medicines FROM medicines');
    // Total Reservations
    const [resRow] = await db.query(`
      SELECT 
        COUNT(*) AS total_reservations,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN status = 'Ready for Pickup' THEN 1 ELSE 0 END) AS ready_for_pickup_count,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_count,
        COALESCE(SUM(total_price), 0) AS total_reservation_value
      FROM reservations
    `);

    // Top searched medicines
    const topSearched = await db.query(`
      SELECT query, COUNT(*) AS search_count 
      FROM search_logs 
      GROUP BY query 
      ORDER BY search_count DESC 
      LIMIT 5
    `);

    // Top reserved medicines
    const topReserved = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.brand_name,
        COUNT(r.id) AS reservation_count,
        SUM(r.quantity) AS units_reserved
      FROM reservations r
      JOIN medicines m ON r.medicine_id = m.id
      GROUP BY m.id
      ORDER BY reservation_count DESC
      LIMIT 5
    `);

    // Recent 5 pharmacy registrations
    const recentPharmacies = await db.query(`
      SELECT id, name, owner_name, license_number, city, phone, approval_status, created_at
      FROM pharmacies
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        totalPatients: patientRow ? patientRow.total_patients : 0,
        totalPharmacies: pharmRow ? pharmRow.total_pharmacies : 0,
        approvedPharmacies: pharmRow ? (pharmRow.approved_pharmacies || 0) : 0,
        pendingApprovals: pharmRow ? (pharmRow.pending_approvals || 0) : 0,
        rejectedPharmacies: pharmRow ? (pharmRow.rejected_pharmacies || 0) : 0,
        suspendedPharmacies: pharmRow ? (pharmRow.suspended_pharmacies || 0) : 0,
        totalMedicines: medRow ? medRow.total_medicines : 0,
        totalReservations: resRow ? resRow.total_reservations : 0,
        reservationBreakdown: resRow,
        topSearched,
        topReserved,
        recentPharmacies
      }
    });
  } catch (error) {
    console.error('getAdminDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin dashboard metrics.' });
  }
}

// 2. Pharmacy Management
async function getAllPharmacies(req, res) {
  try {
    const { status = 'all', search = '' } = req.query;

    let where = ['1=1'];
    let params = [];

    if (status && status !== 'all') {
      where.push('p.approval_status = ?');
      params.push(status);
    }

    if (search.trim()) {
      where.push('(p.name LIKE ? OR p.owner_name LIKE ? OR p.license_number LIKE ? OR p.city LIKE ?)');
      const p = `%${search.trim()}%`;
      params.push(p, p, p, p);
    }

    const sql = `
      SELECT 
        p.*,
        u.email AS user_email,
        u.status AS user_account_status,
        COUNT(DISTINCT pi.id) AS inventory_count,
        COUNT(DISTINCT r.id) AS total_reservations_count
      FROM pharmacies p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN pharmacy_inventory pi ON p.id = pi.pharmacy_id
      LEFT JOIN reservations r ON p.id = r.pharmacy_id
      WHERE ${where.join(' AND ')}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const pharmacies = await db.query(sql, params);
    return res.json({ success: true, data: pharmacies });
  } catch (error) {
    console.error('getAllPharmacies error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pharmacies list.' });
  }
}

// Approve Pharmacy
async function approvePharmacy(req, res) {
  try {
    const { id } = req.params;
    await db.query("UPDATE pharmacies SET approval_status = 'approved', updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Pharmacy approved successfully. Inventory is now live.' });
  } catch (error) {
    console.error('approvePharmacy error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve pharmacy.' });
  }
}

// Reject Pharmacy
async function rejectPharmacy(req, res) {
  try {
    const { id } = req.params;
    await db.query("UPDATE pharmacies SET approval_status = 'rejected', updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Pharmacy registration rejected.' });
  } catch (error) {
    console.error('rejectPharmacy error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject pharmacy.' });
  }
}

// Suspend Pharmacy
async function suspendPharmacy(req, res) {
  try {
    const { id } = req.params;
    await db.query("UPDATE pharmacies SET approval_status = 'suspended', updated_at = NOW() WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Pharmacy suspended. Public inventory access hidden.' });
  } catch (error) {
    console.error('suspendPharmacy error:', error);
    return res.status(500).json({ success: false, message: 'Failed to suspend pharmacy.' });
  }
}

// 3. Patient Management
async function getAllPatients(req, res) {
  try {
    const { search = '', status = 'all' } = req.query;

    let where = ["u.role = 'patient'"];
    let params = [];

    if (status && status !== 'all') {
      where.push('u.status = ?');
      params.push(status);
    }

    if (search.trim()) {
      where.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const p = `%${search.trim()}%`;
      params.push(p, p, p);
    }

    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.status,
        u.created_at,
        COUNT(r.id) AS total_reservations,
        SUM(CASE WHEN r.status = 'Completed' THEN 1 ELSE 0 END) AS completed_reservations
      FROM users u
      LEFT JOIN reservations r ON u.id = r.patient_id
      WHERE ${where.join(' AND ')}
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;

    const patients = await db.query(sql, params);
    return res.json({ success: true, data: patients });
  } catch (error) {
    console.error('getAllPatients error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve patients.' });
  }
}

// Toggle Patient/User Account Status (active / suspended)
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'active' or 'suspended'." });
    }

    await db.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    return res.json({ success: true, message: `User status changed to ${status}.` });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
}

// 4. Medicine Management (Global Catalog)
async function getAllMedicines(req, res) {
  try {
    const { search = '', category_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let where = ['1=1'];
    let params = [];

    if (search.trim()) {
      where.push('(m.brand_name LIKE ? OR m.generic_name LIKE ? OR m.active_ingredient LIKE ? OR m.manufacturer LIKE ?)');
      const p = `%${search.trim()}%`;
      params.push(p, p, p, p);
    }

    if (category_id) {
      where.push('m.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    const sql = `
      SELECT 
        m.*,
        c.name AS category_name,
        COUNT(DISTINCT pi.pharmacy_id) AS pharmacies_stocking_count
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN pharmacy_inventory pi ON m.id = pi.medicine_id
      WHERE ${where.join(' AND ')}
      GROUP BY m.id
      ORDER BY m.brand_name ASC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const medicines = await db.query(sql, params);

    return res.json({ success: true, data: medicines });
  } catch (error) {
    console.error('getAllMedicines error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve medicines.' });
  }
}

// Add New Medicine to Catalog
async function createMedicine(req, res) {
  try {
    const {
      name,
      brandName,
      genericName,
      activeIngredient,
      strength,
      dosageForm,
      manufacturer,
      categoryId,
      prescriptionRequired,
      description,
      usageInstructions,
      sideEffects
    } = req.body;

    if (!name || !brandName || !genericName || !activeIngredient || !strength || !dosageForm || !manufacturer) {
      return res.status(400).json({
        success: false,
        message: 'Name, brand name, generic name, active ingredient, strength, dosage form, and manufacturer are required.'
      });
    }

    const result = await db.query(
      `INSERT INTO medicines (
        name, brand_name, generic_name, active_ingredient,
        strength, dosage_form, manufacturer, category_id,
        prescription_required, description, usage_instructions, side_effects
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        brandName.trim(),
        genericName.trim(),
        activeIngredient.trim(),
        strength.trim(),
        dosageForm.trim(),
        manufacturer.trim(),
        categoryId || null,
        prescriptionRequired ? 1 : 0,
        description || null,
        usageInstructions || null,
        sideEffects || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Medicine added to global catalog successfully.',
      medicineId: result.insertId
    });
  } catch (error) {
    console.error('createMedicine error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create medicine.' });
  }
}

// Update Medicine
async function updateMedicine(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      brandName,
      genericName,
      activeIngredient,
      strength,
      dosageForm,
      manufacturer,
      categoryId,
      prescriptionRequired,
      description,
      usageInstructions,
      sideEffects
    } = req.body;

    await db.query(
      `UPDATE medicines SET 
        name = ?, brand_name = ?, generic_name = ?, active_ingredient = ?,
        strength = ?, dosage_form = ?, manufacturer = ?, category_id = ?,
        prescription_required = ?, description = ?, usage_instructions = ?, side_effects = ?
       WHERE id = ?`,
      [
        name.trim(),
        brandName.trim(),
        genericName.trim(),
        activeIngredient.trim(),
        strength.trim(),
        dosageForm.trim(),
        manufacturer.trim(),
        categoryId || null,
        prescriptionRequired ? 1 : 0,
        description || null,
        usageInstructions || null,
        sideEffects || null,
        id
      ]
    );

    return res.json({ success: true, message: 'Medicine updated successfully.' });
  } catch (error) {
    console.error('updateMedicine error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update medicine.' });
  }
}

// Delete Medicine
async function deleteMedicine(req, res) {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM medicines WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Medicine deleted successfully.' });
  } catch (error) {
    console.error('deleteMedicine error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete medicine.' });
  }
}

// 5. Category Management
async function createCategory(req, res) {
  try {
    const { name, slug, description, iconName } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Category name and slug are required.' });
    }

    const result = await db.query(
      'INSERT INTO categories (name, slug, description, icon_name) VALUES (?, ?, ?, ?)',
      [name.trim(), slug.trim().toLowerCase(), description || null, iconName || 'Pill']
    );

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('createCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
}

// 6. View All Reservations (Admin)
async function getAllReservations(req, res) {
  try {
    const { status = 'all', search = '', limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let where = ['1=1'];
    let params = [];

    if (status && status !== 'all') {
      where.push('r.status = ?');
      params.push(status);
    }

    if (search.trim()) {
      where.push('(r.reservation_code LIKE ? OR u.name LIKE ? OR p.name LIKE ? OR m.brand_name LIKE ?)');
      const p = `%${search.trim()}%`;
      params.push(p, p, p, p);
    }

    const sql = `
      SELECT 
        r.*,
        u.name AS patient_name,
        u.email AS patient_email,
        u.phone AS patient_phone,
        p.name AS pharmacy_name,
        p.phone AS pharmacy_phone,
        p.city AS pharmacy_city,
        m.name AS medicine_name,
        m.brand_name,
        m.strength,
        m.dosage_form
      FROM reservations r
      JOIN users u ON r.patient_id = u.id
      JOIN pharmacies p ON r.pharmacy_id = p.id
      JOIN medicines m ON r.medicine_id = m.id
      WHERE ${where.join(' AND ')}
      ORDER BY r.reserved_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const reservations = await db.query(sql, params);

    return res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('getAllReservations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reservations.' });
  }
}

module.exports = {
  getAdminDashboardStats,
  getAllPharmacies,
  approvePharmacy,
  rejectPharmacy,
  suspendPharmacy,
  getAllPatients,
  updateUserStatus,
  getAllMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  createCategory,
  getAllReservations
};

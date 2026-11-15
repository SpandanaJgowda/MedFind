const db = require('../config/db');

// Helper to generate unique reservation code
function generateReservationCode() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `MF-RES-${randomNum}`;
}

// 1. Create Medicine Reservation (Patient)
async function createReservation(req, res) {
  try {
    const patientId = req.user.id;
    const { pharmacyId, medicineId, quantity, notes } = req.body;

    if (!pharmacyId || !medicineId || !quantity) {
      return res.status(400).json({ success: false, message: 'Pharmacy, medicine, and quantity are required.' });
    }

    const requestedQty = parseInt(quantity, 10);
    if (isNaN(requestedQty) || requestedQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1 unit.' });
    }

    // Verify pharmacy is approved
    const pharmRows = await db.query('SELECT id, name, approval_status, address, phone, opening_hours FROM pharmacies WHERE id = ?', [pharmacyId]);
    if (pharmRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found.' });
    }
    const pharmacy = pharmRows[0];
    if (pharmacy.approval_status !== 'approved') {
      return res.status(400).json({ success: false, message: 'This pharmacy is not currently accepting reservations.' });
    }

    // Check inventory stock and price
    const invRows = await db.query(
      'SELECT id, price, quantity FROM pharmacy_inventory WHERE pharmacy_id = ? AND medicine_id = ?',
      [pharmacyId, medicineId]
    );

    if (invRows.length === 0) {
      return res.status(404).json({ success: false, message: 'This medicine is not listed in the selected pharmacy inventory.' });
    }

    const inventory = invRows[0];
    if (inventory.quantity < requestedQty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock available. Only ${inventory.quantity} units are currently in stock at ${pharmacy.name}.`
      });
    }

    // Medicine details
    const medRows = await db.query(
      'SELECT id, name, brand_name, strength, dosage_form, prescription_required FROM medicines WHERE id = ?',
      [medicineId]
    );
    if (medRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine details not found.' });
    }
    const medicine = medRows[0];

    const unitPrice = parseFloat(inventory.price);
    const totalPrice = parseFloat((unitPrice * requestedQty).toFixed(2));
    const reservationCode = generateReservationCode();

    // 24 hours pickup window from now
    const pickupDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const insertSql = `
      INSERT INTO reservations (
        reservation_code, patient_id, pharmacy_id, medicine_id,
        quantity, unit_price, total_price, status, patient_notes,
        pickup_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `;

    const result = await db.query(insertSql, [
      reservationCode,
      patientId,
      pharmacyId,
      medicineId,
      requestedQty,
      unitPrice,
      totalPrice,
      notes || null,
      pickupDeadline
    ]);

    return res.status(201).json({
      success: true,
      message: 'Medicine reserved successfully! The pharmacy has been notified to prepare your order.',
      reservation: {
        id: result.insertId,
        reservationCode,
        status: 'Pending',
        quantity: requestedQty,
        unitPrice,
        totalPrice,
        pickupDeadline,
        medicine: {
          id: medicine.id,
          name: medicine.name,
          brandName: medicine.brand_name,
          strength: medicine.strength,
          dosageForm: medicine.dosage_form,
          prescriptionRequired: medicine.prescription_required
        },
        pharmacy: {
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          openingHours: pharmacy.opening_hours
        },
        collectionInstructions: [
          'Please visit the pharmacy within 24 hours of confirmation.',
          'Show your Reservation Code at the pickup counter.',
          medicine.prescription_required ? 'IMPORTANT: A valid doctor prescription is mandatory for this medication.' : 'Present standard photo identification if requested.',
          'Payment is made directly at the pharmacy counter upon physical collection.'
        ]
      }
    });
  } catch (error) {
    console.error('createReservation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create medicine reservation.' });
  }
}

// 2. Get Patient's Reservations
async function getPatientReservations(req, res) {
  try {
    const patientId = req.user.id;
    const { status } = req.query;

    let whereClauses = ['r.patient_id = ?'];
    let params = [patientId];

    if (status && status !== 'all') {
      if (status === 'active') {
        whereClauses.push("r.status IN ('Pending', 'Confirmed', 'Ready for Pickup')");
      } else {
        whereClauses.push('r.status = ?');
        params.push(status);
      }
    }

    const sql = `
      SELECT 
        r.*,
        p.name AS pharmacy_name,
        p.address AS pharmacy_address,
        p.phone AS pharmacy_phone,
        p.opening_hours AS pharmacy_hours,
        p.latitude AS pharmacy_lat,
        p.longitude AS pharmacy_lng,
        m.name AS medicine_name,
        m.brand_name,
        m.generic_name,
        m.strength,
        m.dosage_form,
        m.prescription_required
      FROM reservations r
      JOIN pharmacies p ON r.pharmacy_id = p.id
      JOIN medicines m ON r.medicine_id = m.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY r.reserved_at DESC
    `;

    const reservations = await db.query(sql, params);
    return res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('getPatientReservations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reservations.' });
  }
}

// 3. Get Pharmacy Incoming Reservations (Pharmacy Owner)
async function getPharmacyReservations(req, res) {
  try {
    const pharmacyId = req.user.pharmacy_id;
    const { status } = req.query;

    let whereClauses = ['r.pharmacy_id = ?'];
    let params = [pharmacyId];

    if (status && status !== 'all') {
      whereClauses.push('r.status = ?');
      params.push(status);
    }

    const sql = `
      SELECT 
        r.*,
        u.name AS patient_name,
        u.email AS patient_email,
        u.phone AS patient_phone,
        m.name AS medicine_name,
        m.brand_name,
        m.strength,
        m.dosage_form,
        m.prescription_required,
        pi.quantity AS current_inventory_stock
      FROM reservations r
      JOIN users u ON r.patient_id = u.id
      JOIN medicines m ON r.medicine_id = m.id
      LEFT JOIN pharmacy_inventory pi ON (pi.pharmacy_id = r.pharmacy_id AND pi.medicine_id = r.medicine_id)
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY r.reserved_at DESC
    `;

    const reservations = await db.query(sql, params);
    return res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('getPharmacyReservations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pharmacy reservations.' });
  }
}

// 4. Update Reservation Status (Pharmacy Owner)
async function updateReservationStatus(req, res) {
  try {
    const pharmacyId = req.user.pharmacy_id;
    const { id } = req.params;
    const { status, pharmacyNotes } = req.body;

    const validStatuses = ['Confirmed', 'Ready for Pickup', 'Completed', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Fetch existing reservation
    const resRows = await db.query(
      'SELECT * FROM reservations WHERE id = ? AND pharmacy_id = ?',
      [id, pharmacyId]
    );

    if (resRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    const reservation = resRows[0];

    // Cannot change completed or cancelled reservations
    if (reservation.status === 'Completed' || reservation.status === 'Cancelled' || reservation.status === 'Rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a reservation that is already ${reservation.status}.`
      });
    }

    // Check stock if accepting
    if (status === 'Confirmed' || status === 'Ready for Pickup') {
      const invRows = await db.query(
        'SELECT quantity FROM pharmacy_inventory WHERE pharmacy_id = ? AND medicine_id = ?',
        [pharmacyId, reservation.medicine_id]
      );

      if (invRows.length === 0 || invRows[0].quantity < reservation.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Cannot accept reservation: requested quantity exceeds current available stock!'
        });
      }
    }

    // If marked Completed, automatically deduct quantity from inventory
    if (status === 'Completed' && reservation.status !== 'Completed') {
      await db.query(
        'UPDATE pharmacy_inventory SET quantity = GREATEST(0, quantity - ?), last_updated = NOW() WHERE pharmacy_id = ? AND medicine_id = ?',
        [reservation.quantity, pharmacyId, reservation.medicine_id]
      );
    }

    await db.query(
      'UPDATE reservations SET status = ?, pharmacy_notes = COALESCE(?, pharmacy_notes), status_updated_at = NOW() WHERE id = ?',
      [status, pharmacyNotes || null, id]
    );

    return res.json({
      success: true,
      message: `Reservation status updated to '${status}'.`
    });
  } catch (error) {
    console.error('updateReservationStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update reservation status.' });
  }
}

// 5. Cancel Reservation (Patient)
async function cancelReservation(req, res) {
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    const resRows = await db.query(
      'SELECT * FROM reservations WHERE id = ? AND patient_id = ?',
      [id, patientId]
    );

    if (resRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    const reservation = resRows[0];
    if (reservation.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed reservations cannot be cancelled.' });
    }
    if (reservation.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Reservation is already cancelled.' });
    }

    await db.query(
      "UPDATE reservations SET status = 'Cancelled', patient_notes = CONCAT(COALESCE(patient_notes, ''), ' [Cancellation reason: ', ?, ']'), status_updated_at = NOW() WHERE id = ?",
      [reason || 'Cancelled by patient', id]
    );

    return res.json({ success: true, message: 'Reservation cancelled successfully.' });
  } catch (error) {
    console.error('cancelReservation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel reservation.' });
  }
}

// 6. Get Reservation by Code
async function getReservationByCode(req, res) {
  try {
    const { code } = req.params;

    const sql = `
      SELECT 
        r.*,
        p.name AS pharmacy_name,
        p.address AS pharmacy_address,
        p.phone AS pharmacy_phone,
        m.name AS medicine_name,
        m.brand_name,
        m.strength,
        m.dosage_form,
        u.name AS patient_name,
        u.phone AS patient_phone
      FROM reservations r
      JOIN pharmacies p ON r.pharmacy_id = p.id
      JOIN medicines m ON r.medicine_id = m.id
      JOIN users u ON r.patient_id = u.id
      WHERE r.reservation_code = ?
    `;

    const rows = await db.query(sql, [code.trim().toUpperCase()]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservation code not found.' });
    }

    const reservation = rows[0];
    const isPatientOwner = req.user.role === 'patient' && String(req.user.id) === String(reservation.patient_id);
    const isPharmacyOwner = req.user.role === 'pharmacy_owner' && String(req.user.pharmacy_id) === String(reservation.pharmacy_id);

    if (!isPatientOwner && !isPharmacyOwner) {
      return res.status(403).json({ success: false, message: 'You do not have access to this reservation.' });
    }

    return res.json({ success: true, data: reservation });
  } catch (error) {
    console.error('getReservationByCode error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reservation details.' });
  }
}

module.exports = {
  createReservation,
  getPatientReservations,
  getPharmacyReservations,
  updateReservationStatus,
  cancelReservation,
  getReservationByCode
};

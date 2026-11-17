const db = require('../config/db');
const crypto = require('crypto');

// Helper to generate unique reservation code
function generateReservationCode() {
  return `MF-RES-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function addNotification(connection, userId, eventType, title, message, resourceType, resourceId) {
  await connection.query(
    'INSERT INTO notifications (user_id, event_type, title, message, resource_type, resource_id) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, eventType, title, message, resourceType, resourceId]
  );
}

// 1. Create Medicine Reservation (Patient)
async function createReservation(req, res) {
  let connection;
  try {
    const patientId = req.user.id;
    const { pharmacyId, medicineId, quantity, notes, prescriptionId } = req.body;

    if (!pharmacyId || !medicineId || !quantity) {
      return res.status(400).json({ success: false, message: 'Pharmacy, medicine, and quantity are required.' });
    }

    const requestedQty = parseInt(quantity, 10);
    if (isNaN(requestedQty) || requestedQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1 unit.' });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [pharmRows] = await connection.query(
      'SELECT id, user_id, name, approval_status, address, phone, opening_hours FROM pharmacies WHERE id = ? FOR UPDATE',
      [pharmacyId]
    );
    if (pharmRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Pharmacy not found.' });
    }
    const pharmacy = pharmRows[0];
    if (pharmacy.approval_status !== 'approved') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'This pharmacy is not currently accepting reservations.' });
    }

    const [medRows] = await connection.query(
      'SELECT id, name, brand_name, strength, dosage_form, prescription_required FROM medicines WHERE id = ?',
      [medicineId]
    );
    if (medRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medicine details not found.' });
    }
    const medicine = medRows[0];

    if (medicine.prescription_required) {
      const [prescriptionRows] = await connection.query(
        `SELECT id FROM prescriptions
         WHERE id = ? AND patient_id = ? AND pharmacy_id = ? AND medicine_id = ? AND status = 'Verified'
         FOR UPDATE`,
        [prescriptionId || 0, patientId, pharmacyId, medicineId]
      );
      if (prescriptionRows.length === 0) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'A pharmacy-verified prescription is required before booking this medicine.' });
      }
    }

    const [invRows] = await connection.query(
      'SELECT id, price, quantity, reserved_quantity FROM pharmacy_inventory WHERE pharmacy_id = ? AND medicine_id = ? FOR UPDATE',
      [pharmacyId, medicineId]
    );

    if (invRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'This medicine is not listed in the selected pharmacy inventory.' });
    }

    const inventory = invRows[0];
    const availableQuantity = inventory.quantity - inventory.reserved_quantity;
    if (availableQuantity < requestedQty) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient available stock. Only ${availableQuantity} units are currently available at ${pharmacy.name}.`
      });
    }

    const unitPrice = parseFloat(inventory.price);
    const totalPrice = parseFloat((unitPrice * requestedQty).toFixed(2));
    const reservationCode = generateReservationCode();

    const insertSql = `
      INSERT INTO reservations (
        reservation_code, patient_id, pharmacy_id, medicine_id,
        quantity, unit_price, total_price, status, patient_notes, prescription_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `;

    const [result] = await connection.query(insertSql, [
      reservationCode,
      patientId,
      pharmacyId,
      medicineId,
      requestedQty,
      unitPrice,
      totalPrice,
      notes || null,
      prescriptionId || null
    ]);

    await addNotification(
      connection,
      pharmacy.user_id,
      'reservation_pending',
      'New medicine booking',
      `${medicine.brand_name} booking request received for ${requestedQty} unit(s).`,
      'reservation',
      result.insertId
    );
    await connection.commit();

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
        pickupDeadline: null,
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
          'The pharmacy will confirm availability and set your collection deadline.',
          'Show your Reservation Code at the pickup counter.',
          medicine.prescription_required ? 'IMPORTANT: A valid doctor prescription is mandatory for this medication.' : 'Present standard photo identification if requested.',
          'Payment is made directly at the pharmacy counter upon physical collection.'
        ]
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('createReservation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create medicine reservation.' });
  } finally {
    if (connection) connection.release();
  }
}

// 2. Get Patient's Reservations
async function getPatientReservations(req, res) {
  try {
    await expireDueReservations();
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
    await expireDueReservations();
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
        pi.quantity - pi.reserved_quantity AS current_inventory_stock
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
  let connection;
  try {
    const pharmacyId = req.user.pharmacy_id;
    const { id } = req.params;
    const { status, pharmacyNotes } = req.body;

    const validStatuses = ['Confirmed', 'Ready for Pickup', 'Completed', 'Rejected', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();
    const [resRows] = await connection.query(
      'SELECT * FROM reservations WHERE id = ? AND pharmacy_id = ? FOR UPDATE',
      [id, pharmacyId]
    );

    if (resRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    const reservation = resRows[0];
    const allowedTransitions = {
      Pending: ['Confirmed', 'Rejected', 'Cancelled'],
      Confirmed: ['Ready for Pickup', 'Cancelled'],
      'Ready for Pickup': ['Completed', 'Cancelled']
    };
    if (!allowedTransitions[reservation.status]?.includes(status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot change reservation from ${reservation.status} to ${status}.`
      });
    }

    const [pharmacyRows] = await connection.query(
      'SELECT user_id, reservation_hold_hours FROM pharmacies WHERE id = ? FOR UPDATE',
      [pharmacyId]
    );
    const pharmacy = pharmacyRows[0];
    let pickupDeadline = reservation.pickup_deadline;

    if (status === 'Confirmed') {
      if (reservation.prescription_id) {
        const [prescriptionRows] = await connection.query(
          "SELECT id FROM prescriptions WHERE id = ? AND status = 'Verified' AND pharmacy_id = ? FOR UPDATE",
          [reservation.prescription_id, pharmacyId]
        );
        if (prescriptionRows.length === 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Prescription verification is required before approving this booking.' });
        }
      }

      const [stockUpdate] = await connection.query(
        `UPDATE pharmacy_inventory
         SET reserved_quantity = reserved_quantity + ?
         WHERE pharmacy_id = ? AND medicine_id = ? AND quantity - reserved_quantity >= ?`,
        [reservation.quantity, pharmacyId, reservation.medicine_id, reservation.quantity]
      );
      if (stockUpdate.affectedRows !== 1) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cannot approve booking: requested quantity exceeds currently available stock.'
        });
      }

      const holdDurationHours = Math.max(1, Math.min(168, parseInt(pharmacy.reservation_hold_hours, 10) || 24));
      const [deadlineRows] = await connection.query(
        'SELECT DATE_ADD(NOW(), INTERVAL ? HOUR) AS pickup_deadline',
        [holdDurationHours]
      );
      pickupDeadline = deadlineRows[0].pickup_deadline;
      await connection.query(
        `UPDATE reservations
         SET status = 'Confirmed', hold_duration_hours = ?, pickup_deadline = ?,
             pharmacy_notes = COALESCE(?, pharmacy_notes), status_updated_at = NOW()
         WHERE id = ?`,
        [holdDurationHours, pickupDeadline, pharmacyNotes || null, id]
      );
    } else if (status === 'Completed') {
      const [stockUpdate] = await connection.query(
        `UPDATE pharmacy_inventory
         SET quantity = quantity - ?, reserved_quantity = reserved_quantity - ?, last_updated = NOW()
         WHERE pharmacy_id = ? AND medicine_id = ? AND quantity >= ? AND reserved_quantity >= ?`,
        [reservation.quantity, reservation.quantity, pharmacyId, reservation.medicine_id, reservation.quantity, reservation.quantity]
      );
      if (stockUpdate.affectedRows !== 1) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'Reserved stock could not be reconciled. Contact support before completing this booking.' });
      }
      await connection.query(
        `UPDATE reservations
         SET status = 'Completed', pharmacy_notes = COALESCE(?, pharmacy_notes), status_updated_at = NOW()
         WHERE id = ?`,
        [pharmacyNotes || null, id]
      );
    } else {
      if (status === 'Cancelled' && ['Confirmed', 'Ready for Pickup'].includes(reservation.status)) {
        await connection.query(
          `UPDATE pharmacy_inventory
           SET reserved_quantity = GREATEST(0, reserved_quantity - ?), last_updated = NOW()
           WHERE pharmacy_id = ? AND medicine_id = ?`,
          [reservation.quantity, pharmacyId, reservation.medicine_id]
        );
      }
      await connection.query(
        `UPDATE reservations
         SET status = ?, cancellation_reason = IF(? = 'Cancelled', ?, cancellation_reason),
             pharmacy_notes = COALESCE(?, pharmacy_notes), status_updated_at = NOW()
         WHERE id = ?`,
        [status, status, pharmacyNotes || 'Cancelled by pharmacy', pharmacyNotes || null, id]
      );
    }

    const statusMessages = {
      Confirmed: `Your booking is approved. Collect it by ${new Date(pickupDeadline).toLocaleString()}.`,
      Rejected: 'The pharmacy could not fulfill your booking.',
      'Ready for Pickup': 'Your medicine is ready for collection.',
      Completed: 'Your booking has been marked as collected.',
      Cancelled: 'The pharmacy cancelled your booking and released the held stock.'
    };
    await addNotification(connection, reservation.patient_id, `reservation_${status.toLowerCase().replaceAll(' ', '_')}`, `Booking ${status}`, statusMessages[status], 'reservation', Number(id));
    await connection.commit();

    return res.json({
      success: true,
      message: `Reservation status updated to '${status}'.`,
      pickupDeadline
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('updateReservationStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update reservation status.' });
  } finally {
    if (connection) connection.release();
  }
}

// 5. Cancel Reservation (Patient)
async function cancelReservation(req, res) {
  let connection;
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    connection = await db.getConnection();
    await connection.beginTransaction();
    const [resRows] = await connection.query(
      'SELECT * FROM reservations WHERE id = ? AND patient_id = ? FOR UPDATE',
      [id, patientId]
    );

    if (resRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    const reservation = resRows[0];
    if (!['Pending', 'Confirmed', 'Ready for Pickup'].includes(reservation.status)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `A ${reservation.status.toLowerCase()} booking cannot be cancelled.` });
    }

    if (['Confirmed', 'Ready for Pickup'].includes(reservation.status)) {
      await connection.query(
        `UPDATE pharmacy_inventory
         SET reserved_quantity = GREATEST(0, reserved_quantity - ?), last_updated = NOW()
         WHERE pharmacy_id = ? AND medicine_id = ?`,
        [reservation.quantity, reservation.pharmacy_id, reservation.medicine_id]
      );
    }
    await connection.query(
      `UPDATE reservations
       SET status = 'Cancelled', cancellation_reason = ?, status_updated_at = NOW()
       WHERE id = ?`,
      [reason || 'Cancelled by patient', id]
    );
    const [pharmacyRows] = await connection.query('SELECT user_id FROM pharmacies WHERE id = ?', [reservation.pharmacy_id]);
    if (pharmacyRows.length) {
      await addNotification(connection, pharmacyRows[0].user_id, 'reservation_cancelled', 'Booking cancelled', `Patient cancelled booking ${reservation.reservation_code}; held stock was released.`, 'reservation', Number(id));
    }
    await connection.commit();

    return res.json({ success: true, message: 'Reservation cancelled successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('cancelReservation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel reservation.' });
  } finally {
    if (connection) connection.release();
  }
}

async function expireDueReservations() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [expiredReservations] = await connection.query(
      `SELECT id, patient_id, pharmacy_id, medicine_id, quantity, reservation_code
       FROM reservations
       WHERE status IN ('Confirmed', 'Ready for Pickup') AND pickup_deadline IS NOT NULL AND pickup_deadline <= NOW()
       FOR UPDATE`
    );

    for (const reservation of expiredReservations) {
      const [updateResult] = await connection.query(
        `UPDATE reservations SET status = 'Cancelled', cancellation_reason = 'Pickup window expired', status_updated_at = NOW()
         WHERE id = ? AND status IN ('Confirmed', 'Ready for Pickup')`,
        [reservation.id]
      );
      if (updateResult.affectedRows !== 1) continue;

      await connection.query(
        `UPDATE pharmacy_inventory
         SET reserved_quantity = GREATEST(0, reserved_quantity - ?), last_updated = NOW()
         WHERE pharmacy_id = ? AND medicine_id = ?`,
        [reservation.quantity, reservation.pharmacy_id, reservation.medicine_id]
      );
      await addNotification(connection, reservation.patient_id, 'reservation_expired', 'Booking expired', `Booking ${reservation.reservation_code} expired and its held stock was released.`, 'reservation', reservation.id);
      const [pharmacyRows] = await connection.query('SELECT user_id FROM pharmacies WHERE id = ?', [reservation.pharmacy_id]);
      if (pharmacyRows.length) {
        await addNotification(connection, pharmacyRows[0].user_id, 'reservation_expired', 'Booking expired', `Booking ${reservation.reservation_code} expired; the held stock is available again.`, 'reservation', reservation.id);
      }
    }

    await connection.commit();
    return expiredReservations.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
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
  getReservationByCode,
  expireDueReservations
};

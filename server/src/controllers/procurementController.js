const crypto = require('crypto');
const db = require('../config/db');

function makeRequestCode() {
  return `MF-PROC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function notify(connection, userId, eventType, title, message, requestId) {
  await connection.query(
    'INSERT INTO notifications (user_id, event_type, title, message, resource_type, resource_id) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, eventType, title, message, 'procurement', requestId]
  );
}

async function expireReadyRequests() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [requests] = await connection.query(
      `SELECT id, patient_id, pharmacy_id, medicine_id, quantity, request_code
       FROM procurement_requests
       WHERE status = 'Ready for Pickup' AND pickup_deadline IS NOT NULL AND pickup_deadline <= NOW()
       FOR UPDATE`
    );

    for (const request of requests) {
      const [updated] = await connection.query(
        `UPDATE procurement_requests
         SET status = 'Cancelled', pharmacy_notes = CONCAT(COALESCE(pharmacy_notes, ''), ' [Pickup hold expired]')
         WHERE id = ? AND status = 'Ready for Pickup'`,
        [request.id]
      );
      if (updated.affectedRows !== 1) continue;

      await connection.query(
        `UPDATE pharmacy_inventory
         SET reserved_quantity = GREATEST(0, reserved_quantity - ?), last_updated = NOW()
         WHERE pharmacy_id = ? AND medicine_id = ?`,
        [request.quantity, request.pharmacy_id, request.medicine_id]
      );
      await notify(connection, request.patient_id, 'procurement_expired', 'Procurement hold expired', `Request ${request.request_code} expired and held stock was released.`, request.id);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createRequest(req, res) {
  let connection;
  try {
    const patientId = req.user.id;
    const { pharmacyId, medicineId, quantity, notes } = req.body;
    const requestedQuantity = Number.parseInt(quantity, 10);
    if (!pharmacyId || !medicineId || !Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 1000) {
      return res.status(400).json({ success: false, message: 'Choose a pharmacy and medicine, and enter a quantity from 1 to 1000.' });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();
    const [pharmacies] = await connection.query(
      "SELECT id, user_id, name, reservation_hold_hours FROM pharmacies WHERE id = ? AND approval_status = 'approved' FOR UPDATE",
      [pharmacyId]
    );
    if (!pharmacies.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Approved pharmacy not found.' });
    }

    const [medicines] = await connection.query('SELECT id, brand_name FROM medicines WHERE id = ?', [medicineId]);
    if (!medicines.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Medicine not found.' });
    }

    const [availableRows] = await connection.query(
      'SELECT quantity - reserved_quantity AS available_quantity FROM pharmacy_inventory WHERE pharmacy_id = ? AND medicine_id = ? FOR UPDATE',
      [pharmacyId, medicineId]
    );
    if (availableRows.length && availableRows[0].available_quantity > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'This pharmacy has stock available. Submit a medicine booking instead.' });
    }

    const requestCode = makeRequestCode();
    const holdDurationHours = Math.max(1, Math.min(168, Number.parseInt(pharmacies[0].reservation_hold_hours, 10) || 24));
    const [result] = await connection.query(
      `INSERT INTO procurement_requests
       (request_code, patient_id, pharmacy_id, medicine_id, quantity, hold_duration_hours, patient_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [requestCode, patientId, pharmacyId, medicineId, requestedQuantity, holdDurationHours, notes?.trim() || null]
    );
    await notify(connection, pharmacies[0].user_id, 'procurement_requested', 'Medicine procurement request', `${medicines[0].brand_name}: ${requestedQuantity} unit(s) requested.`, result.insertId);
    await connection.commit();

    return res.status(201).json({ success: true, request: { id: result.insertId, requestCode, status: 'Pending' } });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('createRequest error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit procurement request.' });
  } finally {
    if (connection) connection.release();
  }
}

async function getPatientRequests(req, res) {
  try {
    await expireReadyRequests();
    const rows = await db.query(
      `SELECT pr.*, m.brand_name, m.generic_name, m.strength, m.dosage_form,
              p.name AS pharmacy_name, p.address AS pharmacy_address, p.city AS pharmacy_city, p.phone AS pharmacy_phone
       FROM procurement_requests pr
       JOIN medicines m ON m.id = pr.medicine_id
       JOIN pharmacies p ON p.id = pr.pharmacy_id
       WHERE pr.patient_id = ?
       ORDER BY pr.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getPatientRequests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve procurement requests.' });
  }
}

async function getPharmacyRequests(req, res) {
  try {
    await expireReadyRequests();
    const rows = await db.query(
      `SELECT pr.*, u.name AS patient_name, u.phone AS patient_phone,
              m.brand_name, m.generic_name, m.strength, m.dosage_form
       FROM procurement_requests pr
       JOIN users u ON u.id = pr.patient_id
       JOIN medicines m ON m.id = pr.medicine_id
       WHERE pr.pharmacy_id = ?
       ORDER BY pr.created_at DESC`,
      [req.user.pharmacy_id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getPharmacyRequests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pharmacy procurement requests.' });
  }
}

async function updateRequestStatus(req, res) {
  let connection;
  try {
    const pharmacyId = req.user.pharmacy_id;
    const { id } = req.params;
    const { status, notes, estimatedArrival, expectedPrice, holdDurationHours } = req.body;
    const transitions = {
      Pending: ['Accepted', 'Rejected', 'Cancelled'],
      Accepted: ['Ordered', 'Delayed', 'Ready for Pickup', 'Cancelled'],
      Ordered: ['Delayed', 'Ready for Pickup', 'Cancelled'],
      Delayed: ['Ordered', 'Ready for Pickup', 'Cancelled'],
      'Ready for Pickup': ['Completed', 'Cancelled']
    };

    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT * FROM procurement_requests WHERE id = ? AND pharmacy_id = ? FOR UPDATE',
      [id, pharmacyId]
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Procurement request not found.' });
    }

    const request = rows[0];
    if (!transitions[request.status]?.includes(status)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Cannot change request from ${request.status} to ${status}.` });
    }
    if (['Rejected', 'Cancelled'].includes(status) && !notes?.trim()) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Provide a reason for rejecting or cancelling this request.' });
    }
    if (status === 'Accepted' && !estimatedArrival) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Provide an estimated arrival date when accepting a procurement request.' });
    }
    if (status === 'Delayed' && !estimatedArrival) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Provide a revised estimated arrival when reporting a delay.' });
    }

    const parsedPrice = expectedPrice === '' || expectedPrice === undefined || expectedPrice === null ? null : Number.parseFloat(expectedPrice);
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Expected price must be zero or greater.' });
    }

    const [pharmacies] = await connection.query('SELECT reservation_hold_hours FROM pharmacies WHERE id = ? FOR UPDATE', [pharmacyId]);
    const configuredHoldHours = Number.parseInt(pharmacies[0]?.reservation_hold_hours, 10) || 24;
    const holdHours = holdDurationHours === undefined
      ? configuredHoldHours
      : Number.parseInt(holdDurationHours, 10);
    if (status === 'Ready for Pickup' && (!Number.isInteger(holdHours) || holdHours < 1 || holdHours > 168)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Collection hold must be between 1 and 168 hours.' });
    }

    let pickupDeadline = request.pickup_deadline;
    if (status === 'Ready for Pickup') {
      const [medicineRows] = await connection.query('SELECT prescription_required FROM medicines WHERE id = ?', [request.medicine_id]);
      if (medicineRows[0]?.prescription_required) {
        const [verifiedPrescriptions] = await connection.query(
          `SELECT id FROM prescriptions
           WHERE patient_id = ? AND pharmacy_id = ? AND medicine_id = ? AND status = 'Verified'
           LIMIT 1 FOR UPDATE`,
          [request.patient_id, pharmacyId, request.medicine_id]
        );
        if (!verifiedPrescriptions.length) {
          await connection.rollback();
          return res.status(403).json({ success: false, message: 'A pharmacy-verified prescription is required before marking this medicine ready.' });
        }
      }

      const [stockUpdate] = await connection.query(
        `UPDATE pharmacy_inventory
         SET reserved_quantity = reserved_quantity + ?
         WHERE pharmacy_id = ? AND medicine_id = ? AND quantity - reserved_quantity >= ?`,
        [request.quantity, pharmacyId, request.medicine_id, request.quantity]
      );
      if (stockUpdate.affectedRows !== 1) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'Add sufficient available inventory before marking this request ready.' });
      }
      const [deadlineRows] = await connection.query('SELECT DATE_ADD(NOW(), INTERVAL ? HOUR) AS pickup_deadline', [holdHours]);
      pickupDeadline = deadlineRows[0].pickup_deadline;
    }

    if (status === 'Completed' || (status === 'Cancelled' && request.status === 'Ready for Pickup')) {
      if (status === 'Completed') {
        const [inventoryUpdate] = await connection.query(
          `UPDATE pharmacy_inventory
           SET quantity = quantity - ?, reserved_quantity = reserved_quantity - ?, last_updated = NOW()
           WHERE pharmacy_id = ? AND medicine_id = ? AND quantity >= ? AND reserved_quantity >= ?`,
          [request.quantity, request.quantity, pharmacyId, request.medicine_id, request.quantity, request.quantity]
        );
        if (inventoryUpdate.affectedRows !== 1) {
          await connection.rollback();
          return res.status(409).json({ success: false, message: 'Reserved stock could not be reconciled.' });
        }
      } else {
        await connection.query(
          'UPDATE pharmacy_inventory SET reserved_quantity = GREATEST(0, reserved_quantity - ?), last_updated = NOW() WHERE pharmacy_id = ? AND medicine_id = ?',
          [request.quantity, pharmacyId, request.medicine_id]
        );
      }
    }

    await connection.query(
      `UPDATE procurement_requests
       SET status = ?, pharmacy_notes = COALESCE(?, pharmacy_notes),
           estimated_arrival = COALESCE(?, estimated_arrival), expected_price = COALESCE(?, expected_price),
           hold_duration_hours = ?, pickup_deadline = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, notes?.trim() || null, estimatedArrival || null, parsedPrice, holdHours, pickupDeadline, id]
    );

    const statusMessages = {
      Accepted: `The pharmacy accepted your procurement request.${estimatedArrival ? ` Estimated arrival: ${estimatedArrival}.` : ''}`,
      Rejected: `The pharmacy could not procure the requested medicine.${notes ? ` Reason: ${notes}` : ''}`,
      Ordered: 'The pharmacy has placed the procurement order.',
      Delayed: `The pharmacy reported a delay.${estimatedArrival ? ` New estimated arrival: ${estimatedArrival}.` : ''}${notes ? ` ${notes}` : ''}`,
      'Ready for Pickup': `Your medicine is ready. Collect it by ${new Date(pickupDeadline).toLocaleString()}.`,
      Completed: 'Your procured medicine has been marked as collected.',
      Cancelled: `The pharmacy cancelled the procurement request.${notes ? ` ${notes}` : ''}`
    };
    await notify(connection, request.patient_id, `procurement_${status.toLowerCase().replaceAll(' ', '_')}`, `Procurement ${status}`, statusMessages[status], Number(id));
    await connection.commit();
    return res.json({ success: true, status, pickupDeadline });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('updateRequestStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update procurement request.' });
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  createRequest,
  getPatientRequests,
  getPharmacyRequests,
  updateRequestStatus,
  expireReadyRequests
};
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const db = require('../config/db');

const prescriptionDirectory = path.resolve(__dirname, '../../private_uploads/prescriptions');
const supportedTypes = {
  'application/pdf': { extension: '.pdf', signature: buffer => buffer.subarray(0, 5).toString() === '%PDF-' },
  'image/jpeg': { extension: '.jpg', signature: buffer => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  'image/png': { extension: '.png', signature: buffer => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/webp': { extension: '.webp', signature: buffer => buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP' }
};

async function uploadPrescription(req, res) {
  let storedPath;
  try {
    const patientId = req.user.id;
    const pharmacyId = Number.parseInt(req.body.pharmacyId, 10);
    const medicineId = Number.parseInt(req.body.medicineId, 10);
    const file = req.file;

    if (!file || !Number.isInteger(pharmacyId) || !Number.isInteger(medicineId)) {
      return res.status(400).json({ success: false, message: 'A prescription file, pharmacy, and medicine are required.' });
    }
    const fileType = supportedTypes[file.mimetype];
    if (!fileType || !fileType.signature(file.buffer)) {
      return res.status(400).json({ success: false, message: 'Upload a valid JPEG, PNG, WebP image, or PDF document.' });
    }

    const pharmacies = await db.query(
      "SELECT id, user_id FROM pharmacies WHERE id = ? AND approval_status = 'approved'",
      [pharmacyId]
    );
    if (!pharmacies.length) return res.status(404).json({ success: false, message: 'Approved pharmacy not found.' });

    const medicines = await db.query('SELECT id, prescription_required FROM medicines WHERE id = ?', [medicineId]);
    if (!medicines.length || !medicines[0].prescription_required) {
      return res.status(400).json({ success: false, message: 'This medicine does not require a prescription.' });
    }

    const storageKey = `${crypto.randomUUID()}${fileType.extension}`;
    await fs.mkdir(prescriptionDirectory, { recursive: true, mode: 0o700 });
    storedPath = path.join(prescriptionDirectory, storageKey);
    await fs.writeFile(storedPath, file.buffer, { flag: 'wx', mode: 0o600 });

    const result = await db.query(
      `INSERT INTO prescriptions
       (patient_id, pharmacy_id, medicine_id, storage_key, original_filename, mime_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patientId, pharmacyId, medicineId, storageKey, path.basename(file.originalname).slice(0, 255), file.mimetype]
    );
    await db.query(
      'INSERT INTO notifications (user_id, event_type, title, message, resource_type, resource_id) VALUES (?, ?, ?, ?, ?, ?)',
      [pharmacies[0].user_id, 'prescription_uploaded', 'Prescription for review', 'A patient uploaded a prescription for verification.', 'prescription', result.insertId]
    );

    return res.status(201).json({
      success: true,
      prescription: { id: result.insertId, status: 'Pending', originalFilename: path.basename(file.originalname) }
    });
  } catch (error) {
    if (storedPath) await fs.unlink(storedPath).catch(() => {});
    console.error('uploadPrescription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload prescription.' });
  }
}

async function getPatientPrescriptions(req, res) {
  try {
    const { medicineId, pharmacyId } = req.query;
    const rows = await db.query(
      `SELECT id, pharmacy_id, medicine_id, original_filename, mime_type, status, review_notes, uploaded_at, reviewed_at
       FROM prescriptions
       WHERE patient_id = ? AND (? IS NULL OR medicine_id = ?) AND (? IS NULL OR pharmacy_id = ?)
       ORDER BY uploaded_at DESC`,
      [req.user.id, medicineId || null, medicineId || null, pharmacyId || null, pharmacyId || null]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getPatientPrescriptions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve prescriptions.' });
  }
}

async function getPharmacyPrescriptions(req, res) {
  try {
    const rows = await db.query(
      `SELECT pr.id, pr.patient_id, pr.medicine_id, pr.original_filename, pr.mime_type,
              pr.status, pr.review_notes, pr.uploaded_at, u.name AS patient_name,
              m.brand_name, m.strength, m.dosage_form
       FROM prescriptions pr
       JOIN users u ON u.id = pr.patient_id
       JOIN medicines m ON m.id = pr.medicine_id
       WHERE pr.pharmacy_id = ?
       ORDER BY (pr.status = 'Pending') DESC, pr.uploaded_at DESC`,
      [req.user.pharmacy_id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getPharmacyPrescriptions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve prescriptions for review.' });
  }
}

async function getPrescriptionFile(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT patient_id, pharmacy_id, storage_key, original_filename, mime_type FROM prescriptions WHERE id = ?',
      [req.params.id]
    );
    if (!rows) return res.status(404).json({ success: false, message: 'Prescription not found.' });

    const isPatient = req.user.role === 'patient' && String(req.user.id) === String(rows.patient_id);
    const isPharmacy = req.user.role === 'pharmacy_owner' && String(req.user.pharmacy_id) === String(rows.pharmacy_id);
    if (!isPatient && !isPharmacy) return res.status(403).json({ success: false, message: 'You do not have access to this prescription.' });

    const filePath = path.join(prescriptionDirectory, path.basename(rows.storage_key));
    const buffer = await fs.readFile(filePath);
    const filename = rows.original_filename.replace(/["\\\r\n]/g, '_');
    res.set('Content-Type', rows.mime_type);
    res.set('Content-Disposition', `inline; filename="${filename}"`);
    res.set('Cache-Control', 'private, no-store');
    return res.send(buffer);
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ success: false, message: 'Prescription file not found.' });
    console.error('getPrescriptionFile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve prescription file.' });
  }
}

async function reviewPrescription(req, res) {
  try {
    const { status, notes } = req.body;
    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Review status must be Verified or Rejected.' });
    }
    if (status === 'Rejected' && !notes?.trim()) {
      return res.status(400).json({ success: false, message: 'Provide a reason when rejecting a prescription.' });
    }

    const [rows] = await db.query(
      `SELECT patient_id FROM prescriptions
       WHERE id = ? AND pharmacy_id = ? AND status = 'Pending'`,
      [req.params.id, req.user.pharmacy_id]
    );
    if (!rows) return res.status(404).json({ success: false, message: 'Pending prescription not found.' });

    const result = await db.query(
      `UPDATE prescriptions SET status = ?, review_notes = ?, reviewed_at = NOW()
       WHERE id = ? AND pharmacy_id = ? AND status = 'Pending'`,
      [status, notes?.trim() || null, req.params.id, req.user.pharmacy_id]
    );
    if (result.affectedRows !== 1) return res.status(409).json({ success: false, message: 'Prescription was already reviewed.' });

    await db.query(
      'INSERT INTO notifications (user_id, event_type, title, message, resource_type, resource_id) VALUES (?, ?, ?, ?, ?, ?)',
      [rows.patient_id, `prescription_${status.toLowerCase()}`, `Prescription ${status}`, status === 'Verified' ? 'Your prescription was verified. You can now book this medicine.' : `Your prescription was rejected. ${notes.trim()}`, 'prescription', Number(req.params.id)]
    );
    return res.json({ success: true, status });
  } catch (error) {
    console.error('reviewPrescription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to review prescription.' });
  }
}

module.exports = {
  uploadPrescription,
  getPatientPrescriptions,
  getPharmacyPrescriptions,
  getPrescriptionFile,
  reviewPrescription
};
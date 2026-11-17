const express = require('express');
const multer = require('multer');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (supportedTypes.includes(file.mimetype)) return callback(null, true);
    return callback(new Error('Upload a JPEG, PNG, WebP image, or PDF document.'));
  }
});

function receivePrescription(req, res, next) {
  upload.single('prescription')(req, res, error => {
    if (error) return res.status(400).json({ success: false, message: error.message });
    next();
  });
}

router.post('/', authenticate, authorize(['patient']), receivePrescription, prescriptionController.uploadPrescription);
router.get('/my', authenticate, authorize(['patient']), prescriptionController.getPatientPrescriptions);
router.get('/pharmacy', authenticate, authorize(['pharmacy_owner']), prescriptionController.getPharmacyPrescriptions);
router.get('/:id/file', authenticate, authorize(['patient', 'pharmacy_owner']), prescriptionController.getPrescriptionFile);
router.put('/:id/review', authenticate, authorize(['pharmacy_owner']), prescriptionController.reviewPrescription);

module.exports = router;
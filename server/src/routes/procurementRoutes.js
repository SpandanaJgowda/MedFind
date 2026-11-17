const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize(['patient']), procurementController.createRequest);
router.get('/my', authenticate, authorize(['patient']), procurementController.getPatientRequests);
router.get('/pharmacy', authenticate, authorize(['pharmacy_owner']), procurementController.getPharmacyRequests);
router.put('/:id/status', authenticate, authorize(['pharmacy_owner']), procurementController.updateRequestStatus);

module.exports = router;
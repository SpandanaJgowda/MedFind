const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');

// Reservation details are visible only to the patient or pharmacy owner involved.
router.get('/track/:code', authenticate, authorize(['patient', 'pharmacy_owner']), reservationController.getReservationByCode);

// Patient reservation endpoints
router.post('/', authenticate, authorize(['patient']), reservationController.createReservation);
router.get('/my', authenticate, authorize(['patient']), reservationController.getPatientReservations);
router.post('/:id/cancel', authenticate, authorize(['patient']), reservationController.cancelReservation);

// Pharmacy reservation endpoints
router.get('/pharmacy', authenticate, authorize(['pharmacy_owner']), reservationController.getPharmacyReservations);
router.put('/:id/status', authenticate, authorize(['pharmacy_owner']), reservationController.updateReservationStatus);

module.exports = router;

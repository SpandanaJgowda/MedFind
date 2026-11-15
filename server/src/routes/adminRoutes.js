const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(authenticate, authorize(['admin']));

// Dashboard stats
router.get('/stats', adminController.getAdminDashboardStats);

// Pharmacy management
router.get('/pharmacies', adminController.getAllPharmacies);
router.put('/pharmacies/:id/approve', adminController.approvePharmacy);
router.put('/pharmacies/:id/reject', adminController.rejectPharmacy);
router.put('/pharmacies/:id/suspend', adminController.suspendPharmacy);

// Patient management
router.get('/patients', adminController.getAllPatients);
router.put('/users/:id/status', adminController.updateUserStatus);

// Medicine catalog management
router.get('/medicines', adminController.getAllMedicines);
router.post('/medicines', adminController.createMedicine);
router.put('/medicines/:id', adminController.updateMedicine);
router.delete('/medicines/:id', adminController.deleteMedicine);

// Category management
router.post('/categories', adminController.createCategory);

// Reservations management
router.get('/reservations', adminController.getAllReservations);

module.exports = router;

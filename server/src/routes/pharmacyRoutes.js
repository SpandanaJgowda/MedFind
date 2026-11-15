const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const { authenticate, authorize } = require('../middleware/auth');

// Public pharmacy discovery
router.get('/nearby', pharmacyController.getNearbyPharmacies);
router.get('/:id', pharmacyController.getPharmacyById);

// Protected Pharmacy Owner operations
router.get('/owner/stats', authenticate, authorize(['pharmacy_owner']), pharmacyController.getPharmacyDashboardStats);
router.get('/owner/inventory', authenticate, authorize(['pharmacy_owner']), pharmacyController.getPharmacyInventory);
router.post('/owner/inventory', authenticate, authorize(['pharmacy_owner']), pharmacyController.addInventoryItem);
router.put('/owner/inventory/:id', authenticate, authorize(['pharmacy_owner']), pharmacyController.updateInventoryItem);
router.delete('/owner/inventory/:id', authenticate, authorize(['pharmacy_owner']), pharmacyController.deleteInventoryItem);
router.put('/owner/profile', authenticate, authorize(['pharmacy_owner']), pharmacyController.updatePharmacyProfile);

module.exports = router;

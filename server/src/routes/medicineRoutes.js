const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { optionalAuth } = require('../middleware/auth');

// Public medicine discovery endpoints
router.get('/search', optionalAuth, medicineController.searchMedicines);
router.get('/suggestions', medicineController.getSuggestions);
router.get('/categories', medicineController.getCategories);
router.get('/recent-searches', optionalAuth, medicineController.getRecentSearches);
router.get('/:id', optionalAuth, medicineController.getMedicineById);

module.exports = router;

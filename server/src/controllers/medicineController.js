const db = require('../config/db');
const DEFAULT_PHARMACY_RADIUS_KM = 25;

// Haversine formula distance calculation in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// 1. Search Medicines with intelligent partial matching and filters
async function searchMedicines(req, res) {
  try {
    const {
      q = '',
      category = '',
      dosage_form = '',
      in_stock_only = 'false',
      sort = 'relevance', // 'relevance', 'price_asc', 'price_desc', 'name_asc'
      user_lat,
      user_lng,
      limit = 20,
      page = 1
    } = req.query;

    const trimmedQuery = q.trim();
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = ['1=1'];
    let params = [];

    // Query filter: matches brand_name, generic_name, active_ingredient, or medicine name
    if (trimmedQuery) {
      whereClauses.push(`(
        m.name LIKE ? OR
        m.brand_name LIKE ? OR
        m.generic_name LIKE ? OR
        m.active_ingredient LIKE ? OR
        m.manufacturer LIKE ?
      )`);
      const searchPattern = `%${trimmedQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Category filter (by slug or ID)
    if (category) {
      if (!isNaN(category)) {
        whereClauses.push('m.category_id = ?');
        params.push(parseInt(category, 10));
      } else {
        whereClauses.push('c.slug = ? OR c.name LIKE ?');
        params.push(category, `%${category}%`);
      }
    }

    // Dosage form filter
    if (dosage_form) {
      whereClauses.push('m.dosage_form = ?');
      params.push(dosage_form);
    }

    const whereSql = whereClauses.join(' AND ');

    // Main query: Fetch medicines with aggregate stock and price across approved pharmacies
    const sql = `
      SELECT 
        m.id,
        m.name,
        m.brand_name,
        m.generic_name,
        m.active_ingredient,
        m.strength,
        m.dosage_form,
        m.manufacturer,
        m.prescription_required,
        m.description,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        COUNT(DISTINCT pi.pharmacy_id) AS total_pharmacies_count,
        COALESCE(SUM(CASE WHEN p.approval_status = 'approved' THEN pi.quantity ELSE 0 END), 0) AS total_available_stock,
        COALESCE(MIN(CASE WHEN p.approval_status = 'approved' AND pi.quantity > 0 THEN pi.price ELSE NULL END), 0) AS min_price,
        COALESCE(MAX(CASE WHEN p.approval_status = 'approved' AND pi.quantity > 0 THEN pi.price ELSE NULL END), 0) AS max_price,
        COUNT(DISTINCT CASE WHEN p.approval_status = 'approved' AND pi.quantity > 0 THEN pi.pharmacy_id END) AS pharmacies_in_stock
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN pharmacy_inventory pi ON m.id = pi.medicine_id
      LEFT JOIN pharmacies p ON pi.pharmacy_id = p.id AND p.approval_status = 'approved'
      WHERE ${whereSql}
      GROUP BY m.id
      ${in_stock_only === 'true' ? 'HAVING pharmacies_in_stock > 0' : ''}
      ORDER BY 
        ${
          sort === 'price_asc'
            ? 'min_price ASC, m.brand_name ASC'
            : sort === 'price_desc'
            ? 'max_price DESC, m.brand_name ASC'
            : sort === 'name_asc'
            ? 'm.brand_name ASC'
            : 'pharmacies_in_stock DESC, m.brand_name ASC'
        }
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const medicines = await db.query(sql, params);

    // Count total matches
    const countSql = `
      SELECT COUNT(DISTINCT m.id) AS total
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN pharmacy_inventory pi ON m.id = pi.medicine_id
      LEFT JOIN pharmacies p ON pi.pharmacy_id = p.id AND p.approval_status = 'approved'
      WHERE ${whereSql}
      ${in_stock_only === 'true' ? 'HAVING COUNT(DISTINCT CASE WHEN p.approval_status = \'approved\' AND pi.quantity > 0 THEN pi.pharmacy_id END) > 0' : ''}
    `;

    const countParams = params.slice(0, params.length - 2);
    const countRes = await db.query(countSql, countParams);
    const totalCount = countRes.length > 0 ? (countRes[0].total || countRes.length) : 0;

    // Log patient search for intelligent suggestions and analytics
    if (trimmedQuery) {
      const patientId = req.user ? req.user.id : null;
      db.query(
        'INSERT INTO search_logs (patient_id, query, category, results_count) VALUES (?, ?, ?, ?)',
        [patientId, trimmedQuery, category || null, medicines.length]
      ).catch(e => console.error('Failed to log search:', e));
    }

    return res.json({
      success: true,
      data: medicines,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalCount / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('searchMedicines error:', error);
    return res.status(500).json({ success: false, message: 'Failed to search medicines.' });
  }
}

// 2. Autocomplete suggestions for quick typeahead
async function getSuggestions(req, res) {
  try {
    const { q = '' } = req.query;
    const query = q.trim();

    if (!query || query.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const pattern = `%${query}%`;
    const sql = `
      SELECT DISTINCT
        brand_name,
        generic_name,
        active_ingredient,
        dosage_form,
        strength,
        id
      FROM medicines
      WHERE 
        brand_name LIKE ? OR 
        generic_name LIKE ? OR 
        active_ingredient LIKE ?
      LIMIT 8
    `;

    const rows = await db.query(sql, [pattern, pattern, pattern]);

    // Format rich suggestions
    const suggestions = rows.map(r => ({
      id: r.id,
      title: `${r.brand_name} (${r.strength})`,
      generic: r.generic_name,
      activeIngredient: r.active_ingredient,
      dosageForm: r.dosage_form,
      displayText: `${r.brand_name} - ${r.active_ingredient} (${r.dosage_form})`
    }));

    return res.json({ success: true, suggestions });
  } catch (error) {
    console.error('getSuggestions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get suggestions.' });
  }
}

// 3. Get Medicine Details by ID with Nearby Pharmacies & Verified Alternatives
async function getMedicineById(req, res) {
  try {
    const { id } = req.params;
    const { user_lat, user_lng } = req.query;

    // Default reference coordinates: Bengaluru city center (MG Road) if patient coords not provided
    const clientLat = user_lat ? parseFloat(user_lat) : 12.9716;
    const clientLng = user_lng ? parseFloat(user_lng) : 77.5946;

    // Fetch medicine details
    const medSql = `
      SELECT 
        m.*,
        c.name AS category_name,
        c.slug AS category_slug,
        c.icon_name AS category_icon
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = ?
    `;

    const meds = await db.query(medSql, [id]);
    if (meds.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found.' });
    }

    const medicine = meds[0];

    // Fetch pharmacies that have this medicine in inventory (Approved pharmacies only)
    const pharmSql = `
      SELECT 
        pi.id AS inventory_id,
        pi.price,
        pi.quantity,
        pi.min_stock_level,
        pi.last_updated,
        p.id AS pharmacy_id,
        p.name AS pharmacy_name,
        p.owner_name,
        p.license_number,
        p.phone,
        p.email,
        p.address,
        p.city,
        p.state,
        p.pincode,
        p.latitude,
        p.longitude,
        p.opening_hours,
        p.approval_status
      FROM pharmacy_inventory pi
      JOIN pharmacies p ON pi.pharmacy_id = p.id
      WHERE pi.medicine_id = ? AND p.approval_status = 'approved'
      ORDER BY pi.price ASC
    `;

    const rawPharmacies = await db.query(pharmSql, [id]);

    // Format pharmacies with distance and availability status
    const pharmacies = rawPharmacies.map(pharm => {
      const distance = calculateHaversineDistance(
        clientLat,
        clientLng,
        parseFloat(pharm.latitude),
        parseFloat(pharm.longitude)
      );

      let availabilityStatus = 'Available';
      if (pharm.quantity <= 0) {
        availabilityStatus = 'Out of Stock';
      } else if (pharm.quantity <= pharm.min_stock_level) {
        availabilityStatus = 'Low Stock';
      }

      return {
        inventoryId: pharm.inventory_id,
        pharmacyId: pharm.pharmacy_id,
        name: pharm.pharmacy_name,
        address: pharm.address,
        city: pharm.city,
        state: pharm.state,
        pincode: pharm.pincode,
        phone: pharm.phone,
        email: pharm.email,
        openingHours: pharm.opening_hours,
        latitude: parseFloat(pharm.latitude),
        longitude: parseFloat(pharm.longitude),
        distanceKm: distance,
        price: parseFloat(pharm.price),
        quantity: parseInt(pharm.quantity, 10),
        minStockLevel: parseInt(pharm.min_stock_level, 10),
        lastUpdated: pharm.last_updated,
        availabilityStatus,
        isAvailable: pharm.quantity > 0
      };
    });

    // Sort pharmacies primarily by distance or availability
    pharmacies.sort((a, b) => {
      // In-stock items first
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return a.distanceKm - b.distanceKm;
    });
    const nearbyPharmacies = pharmacies.filter(pharmacy => pharmacy.distanceKm <= DEFAULT_PHARMACY_RADIUS_KM);

    // Find Verified Bio-Equivalent Alternatives:
    // Identical active ingredient, strength, and dosage form
    const altSql = `
      SELECT 
        m.id,
        m.name,
        m.brand_name,
        m.generic_name,
        m.active_ingredient,
        m.strength,
        m.dosage_form,
        m.manufacturer,
        m.prescription_required,
        COALESCE(MIN(CASE WHEN p.approval_status = 'approved' AND pi.quantity > 0 THEN pi.price ELSE NULL END), 0) AS min_price,
        COUNT(DISTINCT CASE WHEN p.approval_status = 'approved' AND pi.quantity > 0 THEN pi.pharmacy_id END) AS available_pharmacies_count
      FROM medicines m
      LEFT JOIN pharmacy_inventory pi ON m.id = pi.medicine_id
      LEFT JOIN pharmacies p ON pi.pharmacy_id = p.id AND p.approval_status = 'approved'
      WHERE 
        m.id != ? AND 
        m.active_ingredient = ? AND 
        m.strength = ? AND 
        m.dosage_form = ?
      GROUP BY m.id
    `;

    const verifiedAlternatives = await db.query(altSql, [
      medicine.id,
      medicine.active_ingredient,
      medicine.strength,
      medicine.dosage_form
    ]);

    return res.json({
      success: true,
      data: {
        ...medicine,
        pharmacies: nearbyPharmacies,
        nearbyPharmacyRadiusKm: DEFAULT_PHARMACY_RADIUS_KM,
        verifiedAlternatives,
        patientReferenceLocation: {
          latitude: clientLat,
          longitude: clientLng,
          label: 'Your Current Search Area'
        },
        medicalDisclaimer: 'IMPORTANT MEDICAL NOTICE: This platform provides medicine availability information and reservation for in-person pickup. Information regarding bio-equivalent alternatives is provided for informational comparison only. Patients must always consult a qualified healthcare professional and present a valid prescription before substituting or taking medications.'
      }
    });
  } catch (error) {
    console.error('getMedicineById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve medicine details.' });
  }
}

// 4. Get Categories with Medicine Counts
async function getCategories(req, res) {
  try {
    const sql = `
      SELECT 
        c.*,
        COUNT(m.id) AS medicine_count
      FROM categories c
      LEFT JOIN medicines m ON c.id = m.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    const categories = await db.query(sql);
    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error('getCategories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
}

// 5. Get Recent Searches for Logged-in Patient
async function getRecentSearches(req, res) {
  try {
    const patientId = req.user ? req.user.id : null;
    let sql = `
      SELECT DISTINCT query, category, MAX(searched_at) AS last_searched
      FROM search_logs
    `;
    const params = [];

    if (patientId) {
      sql += ' WHERE patient_id = ?';
      params.push(patientId);
    }

    sql += ' GROUP BY query, category ORDER BY last_searched DESC LIMIT 6';

    const recent = await db.query(sql, params);
    return res.json({ success: true, data: recent });
  } catch (error) {
    console.error('getRecentSearches error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve recent searches.' });
  }
}

module.exports = {
  searchMedicines,
  getSuggestions,
  getMedicineById,
  getCategories,
  getRecentSearches
};

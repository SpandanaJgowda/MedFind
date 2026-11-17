const db = require('../config/db');

// Distance helper
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// 1. Discover Nearby Approved Pharmacies
async function getNearbyPharmacies(req, res) {
  try {
    const { user_lat, user_lng, search, medicine_id } = req.query;
    const clientLat = Number.parseFloat(user_lat);
    const clientLng = Number.parseFloat(user_lng);
    const radiusParam = req.query.radius_km === undefined ? 25 : Number.parseFloat(req.query.radius_km);
    const limitParam = req.query.limit === undefined ? 20 : Number.parseInt(req.query.limit, 10);

    if (!Number.isFinite(clientLat) || !Number.isFinite(clientLng) || clientLat < -90 || clientLat > 90 || clientLng < -180 || clientLng > 180) {
      return res.status(400).json({ success: false, message: 'A valid patient latitude and longitude are required.' });
    }
    if (!Number.isFinite(radiusParam) || radiusParam <= 0) {
      return res.status(400).json({ success: false, message: 'Search radius must be a positive number of kilometers.' });
    }
    const radiusKm = Math.min(radiusParam, 100);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;

    let where = ["p.approval_status = 'approved'"];
    let params = [];

    if (search) {
      where.push('(p.name LIKE ? OR p.address LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const sql = `
      SELECT 
        p.*,
        COUNT(DISTINCT pi.id) AS total_medicines_count,
        SUM(CASE WHEN pi.quantity - pi.reserved_quantity > 0 THEN 1 ELSE 0 END) AS in_stock_medicines_count
      FROM pharmacies p
      LEFT JOIN pharmacy_inventory pi ON p.id = pi.pharmacy_id
      WHERE ${where.join(' AND ')}
      GROUP BY p.id
      ORDER BY p.name ASC
    `;

    const rawPharmacies = await db.query(sql, params);

    // Calculate distance and attach medicine price if medicine_id passed
    const pharmacies = await Promise.all(
      rawPharmacies.map(async pharm => {
        const distance = calculateDistance(
          clientLat,
          clientLng,
          parseFloat(pharm.latitude),
          parseFloat(pharm.longitude)
        );

        let specificMedicineStock = null;
        if (medicine_id) {
          const medStockRows = await db.query(
            'SELECT price, quantity - reserved_quantity AS quantity, min_stock_level, last_updated FROM pharmacy_inventory WHERE pharmacy_id = ? AND medicine_id = ?',
            [pharm.id, medicine_id]
          );
          if (medStockRows.length > 0) {
            const ms = medStockRows[0];
            specificMedicineStock = {
              price: parseFloat(ms.price),
              quantity: parseInt(ms.quantity, 10),
              minStockLevel: parseInt(ms.min_stock_level, 10),
              status: ms.quantity <= 0 ? 'Out of Stock' : (ms.quantity <= ms.min_stock_level ? 'Low Stock' : 'Available'),
              lastUpdated: ms.last_updated
            };
          }
        }

        return {
          id: pharm.id,
          name: pharm.name,
          ownerName: pharm.owner_name,
          licenseNumber: pharm.license_number,
          phone: pharm.phone,
          email: pharm.email,
          address: pharm.address,
          city: pharm.city,
          state: pharm.state,
          pincode: pharm.pincode,
          latitude: parseFloat(pharm.latitude),
          longitude: parseFloat(pharm.longitude),
          openingHours: pharm.opening_hours,
          distanceKm: distance,
          totalMedicinesCount: parseInt(pharm.total_medicines_count || 0, 10),
          inStockCount: parseInt(pharm.in_stock_medicines_count || 0, 10),
          specificMedicineStock
        };
      })
    );

    // Coordinates are authoritative; a reverse-geocoded label may contain a locality and district.
    const nearbyPharmacies = pharmacies
      .filter(pharmacy => Number.isFinite(pharmacy.distanceKm) && pharmacy.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return res.json({
      success: true,
      data: nearbyPharmacies,
      userLocation: { latitude: clientLat, longitude: clientLng },
      radiusKm
    });
  } catch (error) {
    console.error('getNearbyPharmacies error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pharmacies.' });
  }
}

// 2. Pharmacy Owner Dashboard Analytics
async function getPharmacyDashboardStats(req, res) {
  try {
    const pharmacyId = req.user.pharmacy_id;
    if (!pharmacyId) {
      return res.status(400).json({ success: false, message: 'No pharmacy affiliated with this account.' });
    }

    // Inventory metrics: Total, Available, Low Stock, Out of Stock
    const invStatsSql = `
      SELECT 
        COUNT(*) AS total_medicines,
        SUM(CASE WHEN quantity - reserved_quantity > min_stock_level THEN 1 ELSE 0 END) AS available_count,
        SUM(CASE WHEN quantity - reserved_quantity > 0 AND quantity - reserved_quantity <= min_stock_level THEN 1 ELSE 0 END) AS low_stock_count,
        SUM(CASE WHEN quantity - reserved_quantity <= 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
        COALESCE(SUM(quantity - reserved_quantity), 0) AS total_inventory_units
      FROM pharmacy_inventory
      WHERE pharmacy_id = ?
    `;

    const invStats = await db.query(invStatsSql, [pharmacyId]);

    // Reservation metrics: Pending, Confirmed, Ready for Pickup, Completed, Cancelled, Rejected
    const resStatsSql = `
      SELECT 
        COUNT(*) AS total_reservations,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN status = 'Ready for Pickup' THEN 1 ELSE 0 END) AS ready_for_pickup_count,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_count,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_price ELSE 0 END), 0) AS total_completed_revenue
      FROM reservations
      WHERE pharmacy_id = ?
    `;

    const resStats = await db.query(resStatsSql, [pharmacyId]);

    // Top Most Reserved Medicines for this pharmacy
    const topReservedSql = `
      SELECT 
        m.name,
        m.brand_name,
        COUNT(r.id) AS reservation_count,
        SUM(r.quantity) AS total_units_reserved,
        SUM(r.total_price) AS total_reserved_value
      FROM reservations r
      JOIN medicines m ON r.medicine_id = m.id
      WHERE r.pharmacy_id = ?
      GROUP BY m.id
      ORDER BY reservation_count DESC
      LIMIT 5
    `;

    const topReserved = await db.query(topReservedSql, [pharmacyId]);

    // Category Distribution in Inventory
    const categoryDistSql = `
      SELECT 
        COALESCE(c.name, 'Uncategorized') AS category_name,
        COUNT(pi.id) AS medicine_count,
        SUM(pi.quantity - pi.reserved_quantity) AS total_units
      FROM pharmacy_inventory pi
      JOIN medicines m ON pi.medicine_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE pi.pharmacy_id = ?
      GROUP BY c.id
      ORDER BY medicine_count DESC
    `;

    const categoryDist = await db.query(categoryDistSql, [pharmacyId]);

    // Recent 5 incoming reservations
    const recentResSql = `
      SELECT 
        r.id,
        r.reservation_code,
        r.quantity,
        r.unit_price,
        r.total_price,
        r.status,
        r.reserved_at,
        u.name AS patient_name,
        u.phone AS patient_phone,
        m.brand_name,
        m.strength,
        m.dosage_form
      FROM reservations r
      JOIN users u ON r.patient_id = u.id
      JOIN medicines m ON r.medicine_id = m.id
      WHERE r.pharmacy_id = ?
      ORDER BY r.reserved_at DESC
      LIMIT 5
    `;

    const recentReservations = await db.query(recentResSql, [pharmacyId]);

    return res.json({
      success: true,
      data: {
        inventory: invStats[0] || {
          total_medicines: 0,
          available_count: 0,
          low_stock_count: 0,
          out_of_stock_count: 0,
          total_inventory_units: 0
        },
        reservations: resStats[0] || {
          total_reservations: 0,
          pending_count: 0,
          confirmed_count: 0,
          ready_for_pickup_count: 0,
          completed_count: 0,
          cancelled_count: 0,
          rejected_count: 0,
          total_completed_revenue: 0
        },
        topReserved,
        categoryDistribution: categoryDist,
        recentReservations
      }
    });
  } catch (error) {
    console.error('getPharmacyDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pharmacy dashboard analytics.' });
  }
}

// 3. Get Pharmacy Inventory with Search & Status Filter
async function getPharmacyInventory(req, res) {
  try {
    const pharmacyId = req.user.pharmacy_id;
    const { search = '', status = 'all', page = 1, limit = 50 } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let whereClauses = ['pi.pharmacy_id = ?'];
    let params = [pharmacyId];

    if (search.trim()) {
      whereClauses.push('(m.brand_name LIKE ? OR m.generic_name LIKE ? OR m.active_ingredient LIKE ?)');
      const p = `%${search.trim()}%`;
      params.push(p, p, p);
    }

    if (status === 'available') {
      whereClauses.push('pi.quantity - pi.reserved_quantity > pi.min_stock_level');
    } else if (status === 'low_stock') {
      whereClauses.push('pi.quantity - pi.reserved_quantity > 0 AND pi.quantity - pi.reserved_quantity <= pi.min_stock_level');
    } else if (status === 'out_of_stock') {
      whereClauses.push('pi.quantity - pi.reserved_quantity <= 0');
    }

    const sql = `
      SELECT 
        pi.id,
        pi.pharmacy_id,
        pi.medicine_id,
        pi.price,
        pi.quantity,
        pi.reserved_quantity,
        pi.quantity - pi.reserved_quantity AS available_quantity,
        pi.min_stock_level,
        pi.last_updated,
        m.name AS medicine_name,
        m.brand_name,
        m.generic_name,
        m.active_ingredient,
        m.strength,
        m.dosage_form,
        m.manufacturer,
        m.prescription_required,
        c.name AS category_name,
        CASE 
          WHEN pi.quantity - pi.reserved_quantity <= 0 THEN 'Out of Stock'
          WHEN pi.quantity - pi.reserved_quantity <= pi.min_stock_level THEN 'Low Stock'
          ELSE 'Available'
        END AS availability_status
      FROM pharmacy_inventory pi
      JOIN medicines m ON pi.medicine_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY pi.last_updated DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const items = await db.query(sql, params);

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('getPharmacyInventory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve inventory.' });
  }
}

// 4. Add Medicine to Pharmacy Inventory
async function addInventoryItem(req, res) {
  try {
    const pharmacyId = req.user.pharmacy_id;
    const { medicineId, price, quantity, minStockLevel } = req.body;

    if (!medicineId || price === undefined || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Medicine ID, price and quantity are required.' });
    }

    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity, 10);
    const numMin = parseInt(minStockLevel || 5, 10);

    if (isNaN(numPrice) || numPrice < 0 || isNaN(numQty) || numQty < 0) {
      return res.status(400).json({ success: false, message: 'Invalid price or quantity value.' });
    }

    // Check if item already exists in pharmacy inventory
    const existing = await db.query(
      'SELECT id, reserved_quantity FROM pharmacy_inventory WHERE pharmacy_id = ? AND medicine_id = ?',
      [pharmacyId, medicineId]
    );

    if (existing.length > 0) {
      if (numQty < existing[0].reserved_quantity) {
        return res.status(400).json({ success: false, message: `Quantity cannot be lower than the ${existing[0].reserved_quantity} units already reserved.` });
      }
      // Update existing item
      await db.query(
        'UPDATE pharmacy_inventory SET price = ?, quantity = ?, min_stock_level = ?, last_updated = NOW() WHERE id = ?',
        [numPrice, numQty, numMin, existing[0].id]
      );
      return res.json({ success: true, message: 'Inventory updated successfully.' });
    }

    // Insert new item
    const result = await db.query(
      'INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, price, quantity, min_stock_level) VALUES (?, ?, ?, ?, ?)',
      [pharmacyId, medicineId, numPrice, numQty, numMin]
    );

    return res.status(201).json({
      success: true,
      message: 'Medicine added to inventory successfully.',
      inventoryId: result.insertId
    });
  } catch (error) {
    console.error('addInventoryItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add medicine to inventory.' });
  }
}

// 5. Update Inventory Item
async function updateInventoryItem(req, res) {
  try {
    const pharmacyId = req.user.pharmacy_id;
    const { id } = req.params;
    const { price, quantity, minStockLevel } = req.body;

    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity, 10);
    const numMin = parseInt(minStockLevel, 10);

    if (isNaN(numPrice) || numPrice < 0 || isNaN(numQty) || numQty < 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid positive numbers for price and quantity.' });
    }

    const check = await db.query('SELECT id, reserved_quantity FROM pharmacy_inventory WHERE id = ? AND pharmacy_id = ?', [id, pharmacyId]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }
    if (numQty < check[0].reserved_quantity) {
      return res.status(400).json({ success: false, message: `Quantity cannot be lower than the ${check[0].reserved_quantity} units already reserved.` });
    }

    await db.query(
      'UPDATE pharmacy_inventory SET price = ?, quantity = ?, min_stock_level = ?, last_updated = NOW() WHERE id = ?',
      [numPrice, numQty, numMin, id]
    );

    return res.json({ success: true, message: 'Inventory item updated successfully.' });
  } catch (error) {
    console.error('updateInventoryItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update inventory.' });
  }
}

// 6. Delete Inventory Item
async function deleteInventoryItem(req, res) {
  try {
    const pharmacyId = req.user.pharmacy_id;
    const { id } = req.params;

    const check = await db.query('SELECT id, reserved_quantity FROM pharmacy_inventory WHERE id = ? AND pharmacy_id = ?', [id, pharmacyId]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Inventory record not found.' });
    }
    if (check[0].reserved_quantity > 0) {
      return res.status(409).json({ success: false, message: 'Inventory cannot be removed while units are reserved for pickup.' });
    }

    await db.query('DELETE FROM pharmacy_inventory WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Medicine removed from inventory.' });
  } catch (error) {
    console.error('deleteInventoryItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete inventory record.' });
  }
}

// 7. Update Pharmacy Profile
async function updatePharmacyProfile(req, res) {
  try {
    const pharmacyId = req.user.pharmacy_id;
    const {
      name,
      phone,
      address,
      city,
      state,
      pincode,
      openingHours,
      reservationHoldHours,
      latitude,
      longitude
    } = req.body;

    const latitudeValue = Number.parseFloat(latitude);
    const longitudeValue = Number.parseFloat(longitude);
    if (!name || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Pharmacy name, address, city, state, PIN code and phone are required.' });
    }
    if (!Number.isFinite(latitudeValue) || !Number.isFinite(longitudeValue) || latitudeValue < -90 || latitudeValue > 90 || longitudeValue < -180 || longitudeValue > 180) {
      return res.status(400).json({ success: false, message: 'Valid store latitude and longitude are required.' });
    }
    const holdHours = Number.parseInt(reservationHoldHours, 10);
    if (!Number.isInteger(holdHours) || holdHours < 1 || holdHours > 168) {
      return res.status(400).json({ success: false, message: 'Reservation hold duration must be between 1 and 168 hours.' });
    }

    await db.query(
      `UPDATE pharmacies SET 
        name = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ?, 
        opening_hours = ?, reservation_hold_hours = ?, latitude = ?, longitude = ?
       WHERE id = ?`,
      [
        name.trim(),
        phone.trim(),
        address.trim(),
        city.trim(),
        state.trim(),
        pincode.trim(),
        openingHours ? openingHours.trim() : '08:00 AM - 10:00 PM',
        holdHours,
        latitudeValue,
        longitudeValue,
        pharmacyId
      ]
    );

    return res.json({ success: true, message: 'Pharmacy profile updated successfully.' });
  } catch (error) {
    console.error('updatePharmacyProfile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update pharmacy profile.' });
  }
}

// 8. Get Single Pharmacy Details
async function getPharmacyById(req, res) {
  try {
    const { id } = req.params;
    const rows = await db.query('SELECT * FROM pharmacies WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found.' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getPharmacyById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get pharmacy details.' });
  }
}

module.exports = {
  getNearbyPharmacies,
  getPharmacyDashboardStats,
  getPharmacyInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updatePharmacyProfile,
  getPharmacyById
};

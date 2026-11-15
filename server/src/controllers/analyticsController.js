const db = require('../config/db');

// Platform Analytics & Reports
async function getPlatformAnalytics(req, res) {
  try {
    // 1. Most searched queries
    const topSearched = await db.query(`
      SELECT query, COUNT(*) AS count
      FROM search_logs
      GROUP BY query
      ORDER BY count DESC
      LIMIT 8
    `);

    // 2. Most reserved medicines
    const topReserved = await db.query(`
      SELECT 
        m.id,
        m.brand_name,
        m.generic_name,
        m.dosage_form,
        COUNT(r.id) AS reservation_count,
        SUM(r.quantity) AS total_units,
        SUM(r.total_price) AS total_amount
      FROM reservations r
      JOIN medicines m ON r.medicine_id = m.id
      GROUP BY m.id
      ORDER BY reservation_count DESC
      LIMIT 8
    `);

    // 3. Reservation status distribution
    const statusDistribution = await db.query(`
      SELECT status, COUNT(*) AS count
      FROM reservations
      GROUP BY status
    `);

    // 4. Pharmacy registration approval breakdown
    const pharmacyStatusBreakdown = await db.query(`
      SELECT approval_status, COUNT(*) AS count
      FROM pharmacies
      GROUP BY approval_status
    `);

    // 5. Category distribution across catalog
    const categoryDistribution = await db.query(`
      SELECT c.name, COUNT(m.id) AS medicine_count
      FROM categories c
      LEFT JOIN medicines m ON c.id = m.category_id
      GROUP BY c.id
      ORDER BY medicine_count DESC
    `);

    return res.json({
      success: true,
      data: {
        topSearched,
        topReserved,
        statusDistribution,
        pharmacyStatusBreakdown,
        categoryDistribution
      }
    });
  } catch (error) {
    console.error('getPlatformAnalytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve analytics.' });
  }
}

module.exports = {
  getPlatformAnalytics
};

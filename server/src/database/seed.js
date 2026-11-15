const bcrypt = require('bcryptjs');
const db = require('../config/db');
const seedDemoPharmacies = process.env.SEED_DEMO_PHARMACIES === 'true';

async function seed() {
  console.log('--- MediFind Database Seeding Started ---');

  try {
    const conn = await db.getConnection();

    // Disable foreign key checks for clean truncation/reset
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE search_logs');
    await conn.query('TRUNCATE TABLE reservations');
    await conn.query('TRUNCATE TABLE pharmacy_inventory');
    await conn.query('TRUNCATE TABLE medicines');
    await conn.query('TRUNCATE TABLE categories');
    await conn.query('TRUNCATE TABLE pharmacies');
    await conn.query('TRUNCATE TABLE users');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Old records cleared.');

    // 1. Seed Users
    const passwordHash = bcrypt.hashSync('Password@123', 10);
    const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
    const pharmacyPasswordHash = bcrypt.hashSync('Pharmacy@123', 10);
    const patientPasswordHash = bcrypt.hashSync('Patient@123', 10);

    const demoPharmacyUsers = [
      ['Dr. Rajesh Kumar', 'apollocentral@medifind.com', pharmacyPasswordHash, 'pharmacy_owner', '+91 9811122233', 'active'],
      ['Suresh Reddy', 'medpluscare@medifind.com', pharmacyPasswordHash, 'pharmacy_owner', '+91 9822233344', 'active'],
      ['Meera Rao', 'wellnessfirst@medifind.com', pharmacyPasswordHash, 'pharmacy_owner', '+91 9833344455', 'active'],
      ['Anand Hegde', 'healthkart@medifind.com', pharmacyPasswordHash, 'pharmacy_owner', '+91 9844455566', 'active'],
      ['Vikram Shenoy', 'lifelinechemists@medifind.com', pharmacyPasswordHash, 'pharmacy_owner', '+91 9855566677', 'active']
    ];
    const usersData = [
      ['System Administrator', 'admin@medifind.com', adminPasswordHash, 'admin', '+91 9876543210', 'active'],
      ...(seedDemoPharmacies ? demoPharmacyUsers : [demoPharmacyUsers[0]]),
      ['Rahul Sharma', 'patient@medifind.com', patientPasswordHash, 'patient', '+91 9900011122', 'active'],
      ['Priya Patel', 'priya.patel@medifind.com', patientPasswordHash, 'patient', '+91 9911122233', 'active'],
      ['Anita Deshmukh', 'anita.deshmukh@medifind.com', patientPasswordHash, 'patient', '+91 9922233344', 'active']
    ];

    const seededUserIds = {};
    for (const u of usersData) {
      const [result] = await conn.query(
        'INSERT INTO users (name, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
        u
      );
      seededUserIds[u[1]] = result.insertId;
    }
    console.log(`Seeded ${usersData.length} users.`);

    // 2. Seed Pharmacies
    const pharmaciesData = seedDemoPharmacies ? [
      [
        2,
        'Apollo Pharmacy Central',
        'Dr. Rajesh Kumar',
        'KA-BLR-PH-2021-0891',
        '+91 80 2558 4411',
        'apollocentral@medifind.com',
        'No. 45, MG Road, Ashok Nagar',
        'Bengaluru',
        'Karnataka',
        '560001',
        12.9715987,
        77.5945627,
        '08:00 AM - 11:00 PM',
        'approved'
      ],
      [
        3,
        'MedPlus Healthcare Koramangala',
        'Suresh Reddy',
        'KA-BLR-PH-2019-1422',
        '+91 80 2552 1100',
        'medpluscare@medifind.com',
        'Shop 12, 80 Feet Road, 4th Block, Koramangala',
        'Bengaluru',
        'Karnataka',
        '560034',
        12.9351929,
        77.6244806,
        '07:30 AM - 11:30 PM',
        'approved'
      ],
      [
        4,
        'Wellness Forever 24/7 Indiranagar',
        'Meera Rao',
        'KA-BLR-PH-2022-3109',
        '+91 80 4123 9988',
        'wellnessfirst@medifind.com',
        'Plot 722, 100 Feet Road, HAL 2nd Stage, Indiranagar',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.9783692,
        77.6408356,
        '24 Hours Open',
        'approved'
      ],
      [
        5,
        'HealthKart Pharmacy Rajajinagar',
        'Anand Hegde',
        'KA-BLR-PH-2020-2218',
        '+91 80 2315 7766',
        'healthkart@medifind.com',
        '33, 1st Block, Dr. Rajkumar Road, Rajajinagar',
        'Bengaluru',
        'Karnataka',
        '560010',
        12.9900213,
        77.5524819,
        '08:30 AM - 10:30 PM',
        'approved'
      ],
      [
        6,
        'Lifeline Chemists & Druggists',
        'Vikram Shenoy',
        'KA-BLR-PH-2024-5541',
        '+91 80 6789 1234',
        'lifelinechemists@medifind.com',
        '512, 27th Main Road, Sector 1, HSR Layout',
        'Bengaluru',
        'Karnataka',
        '560102',
        12.9141417,
        77.6366024,
        '09:00 AM - 10:00 PM',
        'pending' // Pending approval for Admin to approve/reject!
      ]
    ] : [[
      seededUserIds['apollocentral@medifind.com'],
      'MediFind Demo Pharmacy',
      'Dr. Rajesh Kumar',
      'DEMO-PHARMACY-LICENSE',
      '+91 80 2558 4411',
      'apollocentral@medifind.com',
      'No. 45, MG Road, Ashok Nagar',
      'Bengaluru',
      'Karnataka',
      '560001',
      12.9715987,
      77.5945627,
      '08:00 AM - 11:00 PM',
      'pending'
    ]];

    for (const p of pharmaciesData) {
      await conn.query(
        `INSERT INTO pharmacies (
          user_id, name, owner_name, license_number, phone, email,
          address, city, state, pincode, latitude, longitude,
          opening_hours, approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p
      );
    }
    console.log(`Seeded ${pharmaciesData.length} pharmacies.`);

    // 3. Seed Categories
    const categoriesData = [
      ['Pain Relief & Fever', 'pain-relief', 'Analgesics, antipyretics and anti-inflammatory medications for pain and fever relief.', 'ShieldAlert'],
      ['Antibiotics & Anti-infectives', 'antibiotics', 'Prescription antibacterial and anti-infective formulations.', 'Pill'],
      ['Diabetes Care', 'diabetes-care', 'Blood glucose regulation tablets, insulin formulations and metabolic care.', 'Activity'],
      ['Cardiovascular & BP', 'cardiovascular', 'Heart medications, antihypertensives, cholesterol regulators and blood thinners.', 'Heart'],
      ['Respiratory & Asthma', 'respiratory', 'Bronchodilators, inhalers and medications for respiratory disorders.', 'Wind'],
      ['Gastrointestinal & Antacids', 'gastrointestinal', 'Acid reflux relief, proton pump inhibitors, antacids and digestive aids.', 'FlaskConical'],
      ['Allergy & Antihistamines', 'allergy', 'Antihistamines, allergy symptom relief and decongestants.', 'Sparkles'],
      ['Vitamins & Supplements', 'vitamins', 'Essential daily vitamins, mineral supplements and immunity boosters.', 'Sun']
    ];

    for (const c of categoriesData) {
      await conn.query(
        'INSERT INTO categories (name, slug, description, icon_name) VALUES (?, ?, ?, ?)',
        c
      );
    }
    console.log(`Seeded ${categoriesData.length} categories.`);

    // 4. Seed Medicines (with verified alternative bio-equivalents)
    const medicinesData = [
      // 1. Dolo 650
      [
        'Dolo 650 Tablet',
        'Dolo 650',
        'Paracetamol',
        'Paracetamol',
        '650mg',
        'Tablet',
        'Micro Labs Ltd',
        1,
        false,
        'Used for effective relief from mild to moderate fever, headache, body aches and pain.',
        'Take 1 tablet every 4 to 6 hours as needed or directed by a physician. Do not exceed 4000mg in 24 hours.',
        'Mild nausea, liver toxicity only upon exceeding recommended dosage.'
      ],
      // 2. Calpol 650 (Alternative to Dolo 650)
      [
        'Calpol 650 Tablet',
        'Calpol 650',
        'Paracetamol',
        'Paracetamol',
        '650mg',
        'Tablet',
        'GlaxoSmithKline Pharmaceuticals Ltd',
        1,
        false,
        'Fast-acting fever reducer and mild-to-moderate pain reliever.',
        'Take 1 tablet after meals with water as prescribed. Do not exceed recommended dosage.',
        'Rare allergic reactions, nausea.'
      ],
      // 3. Pacimol 650 (Alternative to Dolo 650)
      [
        'Pacimol 650 Tablet',
        'Pacimol 650',
        'Paracetamol',
        'Paracetamol',
        '650mg',
        'Tablet',
        'Ipca Laboratories Ltd',
        1,
        false,
        'Paracetamol 650mg formulation for fever, post-vaccination fever and arthritis pain.',
        'Take 1 tablet every 6 hours with food or water.',
        'Rare skin rashes, gastric upset.'
      ],

      // 4. Augmentin 625 Duo
      [
        'Augmentin 625 Duo Tablet',
        'Augmentin 625 Duo',
        'Amoxicillin + Clavulanic Acid',
        'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
        '625mg',
        'Tablet',
        'GlaxoSmithKline Pharmaceuticals Ltd',
        2,
        true,
        'Broad-spectrum penicillin antibiotic combined with clavulanate to treat bacterial infections of ears, throat, lungs, skin and urinary tract.',
        'Take with meals to minimize gastrointestinal discomfort. Complete the full course prescribed by your doctor.',
        'Mild diarrhea, nausea, skin rash. Consult physician if severe.'
      ],
      // 5. Moxikind-CV 625 (Alternative to Augmentin 625 Duo)
      [
        'Moxikind-CV 625 Tablet',
        'Moxikind-CV 625',
        'Amoxicillin + Clavulanic Acid',
        'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
        '625mg',
        'Tablet',
        'Mankind Pharma Ltd',
        2,
        true,
        'Antibiotic medication for treating resistant bacterial infections in respiratory tract and soft tissues.',
        'Take strictly as advised by doctor. Take at the start of a meal.',
        'Diarrhea, vomiting, headache.'
      ],
      // 6. Clavam 625 (Alternative to Augmentin 625 Duo)
      [
        'Clavam 625 Tablet',
        'Clavam 625',
        'Amoxicillin + Clavulanic Acid',
        'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
        '625mg',
        'Tablet',
        'Alkem Laboratories Ltd',
        2,
        true,
        'Effective antibacterial combination for pneumonia, bronchitis and sinusitis infections.',
        'Swallow whole with plenty of water at mealtime.',
        'Loose stools, stomach ache, mild dizziness.'
      ],

      // 7. Glycomet 500
      [
        'Glycomet 500mg Tablet',
        'Glycomet 500',
        'Metformin Hydrochloride',
        'Metformin Hydrochloride',
        '500mg',
        'Tablet',
        'USV Ltd',
        3,
        true,
        'First-line oral antidiabetic medicine for adults with type 2 diabetes mellitus to manage blood glucose levels.',
        'Take with or immediately after meals to reduce stomach upset.',
        'Nausea, diarrhea, metallic taste, abdominal pain.'
      ],
      // 8. Obimet 500 (Alternative to Glycomet 500)
      [
        'Obimet 500mg Tablet',
        'Obimet 500',
        'Metformin Hydrochloride',
        'Metformin Hydrochloride',
        '500mg',
        'Tablet',
        'Abbott Healthcare Pvt Ltd',
        3,
        true,
        'Metformin oral therapy for improving insulin sensitivity and blood sugar management in type 2 diabetes.',
        'Take once or twice daily with breakfast or dinner.',
        'Stomach discomfort, flatulence, fatigue.'
      ],

      // 9. Atorva 10
      [
        'Atorva 10mg Tablet',
        'Atorva 10',
        'Atorvastatin Calcium',
        'Atorvastatin Calcium',
        '10mg',
        'Tablet',
        'Zydus Cadila',
        4,
        true,
        'Statin lipid-lowering medication to reduce LDL (bad cholesterol) and triglycerides and lower cardiovascular risks.',
        'Take once daily at the same time, with or without food, preferably in the evening.',
        'Muscle ache, headache, digestive disturbances.'
      ],
      // 10. Storvas 10 (Alternative to Atorva 10)
      [
        'Storvas 10mg Tablet',
        'Storvas 10',
        'Atorvastatin Calcium',
        'Atorvastatin Calcium',
        '10mg',
        'Tablet',
        'Sun Pharmaceutical Industries Ltd',
        4,
        true,
        'HMG-CoA reductase inhibitor for cholesterol and cardiovascular prevention therapy.',
        'Take once daily at bedtime with water.',
        'Mild muscle soreness, joint discomfort.'
      ],

      // 11. Pan 40
      [
        'Pan 40mg Tablet',
        'Pan 40',
        'Pantoprazole Sodium',
        'Pantoprazole Sodium',
        '40mg',
        'Tablet',
        'Alkem Laboratories Ltd',
        6,
        false,
        'Proton pump inhibitor (PPI) that decreases stomach acid production for treating GERD, acidity and peptic ulcers.',
        'Take 1 tablet in the morning 30-60 minutes before breakfast on an empty stomach.',
        'Headache, stomach pain, flatulence.'
      ],
      // 12. Pantocid 40 (Alternative to Pan 40)
      [
        'Pantocid 40mg Tablet',
        'Pantocid 40',
        'Pantoprazole Sodium',
        'Pantoprazole Sodium',
        '40mg',
        'Tablet',
        'Sun Pharmaceutical Industries Ltd',
        6,
        false,
        'Rapid acid suppression medication for heartburn, acid reflux and gastroesophageal reflux disease.',
        'Swallow whole with a glass of water before food in morning.',
        'Mild dizziness, dry mouth.'
      ],

      // 13. Montair LC
      [
        'Montair LC Tablet',
        'Montair LC',
        'Montelukast + Levocetirizine',
        'Montelukast (10mg) + Levocetirizine (5mg)',
        '10mg/5mg',
        'Tablet',
        'Cipla Ltd',
        7,
        false,
        'Dual-action formulation for allergic rhinitis, sneezing, runny nose, itchy eyes and asthma symptoms.',
        'Take 1 tablet at night before sleeping, with or without food.',
        'Mild sleepiness, fatigue, dry mouth, headache.'
      ],
      // 14. Telekast-L (Alternative to Montair LC)
      [
        'Telekast-L Tablet',
        'Telekast-L',
        'Montelukast + Levocetirizine',
        'Montelukast (10mg) + Levocetirizine (5mg)',
        '10mg/5mg',
        'Tablet',
        'Lupin Ltd',
        7,
        false,
        'Combined antihistamine and leukotriene receptor antagonist for hay fever and allergy relief.',
        'Take once daily at bedtime as directed.',
        'Drowsiness, dry mouth.'
      ],

      // 15. Azithral 500
      [
        'Azithral 500mg Tablet',
        'Azithral 500',
        'Azithromycin',
        'Azithromycin',
        '500mg',
        'Tablet',
        'Alembic Pharmaceuticals Ltd',
        2,
        true,
        'Macrolide antibiotic used to treat bacterial chest infections, tonsillitis, sinus infections and skin infections.',
        'Take 1 tablet once a day 1 hour before or 2 hours after meals for 3 to 5 days as prescribed.',
        'Nausea, loose stools, vomiting, abdominal cramps.'
      ],
      // 16. Azee 500 (Alternative to Azithral 500)
      [
        'Azee 500mg Tablet',
        'Azee 500',
        'Azithromycin',
        'Azithromycin',
        '500mg',
        'Tablet',
        'Cipla Ltd',
        2,
        true,
        'Effective macrolide antibiotic against susceptible bacterial strains in respiratory and throat infections.',
        'Take once daily on an empty stomach with a full glass of water.',
        'Temporary nausea, stomach distress.'
      ],

      // 17. Asthalin Inhaler
      [
        'Asthalin 100mcg Inhaler',
        'Asthalin Inhaler',
        'Salbutamol',
        'Salbutamol',
        '100mcg/puff',
        'Inhaler',
        'Cipla Ltd',
        5,
        true,
        'Fast-acting bronchodilator inhaler for instant relief from sudden wheezing, shortness of breath and asthma attacks.',
        'Inhale 1 to 2 puffs during sudden breathlessness or 15 minutes before exercise.',
        'Tremors, increased heart rate, mild nervousness.'
      ],
      // 18. Budecort 200 Inhaler
      [
        'Budecort 200 Inhaler',
        'Budecort 200',
        'Budesonide',
        'Budesonide',
        '200mcg/puff',
        'Inhaler',
        'Cipla Ltd',
        5,
        true,
        'Corticosteroid maintenance inhaler to prevent asthma exacerbations and chronic bronchitis swelling.',
        'Rinse mouth thoroughly with water after each inhalation to prevent fungal infection.',
        'Hoarseness of voice, throat irritation.'
      ]
    ];

    for (const m of medicinesData) {
      await conn.query(
        `INSERT INTO medicines (
          name, brand_name, generic_name, active_ingredient,
          strength, dosage_form, manufacturer, category_id,
          prescription_required, description, usage_instructions, side_effects
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m
      );
    }
    console.log(`Seeded ${medicinesData.length} medicines.`);

    // 5. Seed Pharmacy Inventory
    // We will distribute medicines across pharmacies with realistic prices and stock levels
    const inventoryData = seedDemoPharmacies ? [
      // Apollo Pharmacy (ID: 1)
      [1, 1, 32.50, 48, 10], // Dolo 650
      [1, 2, 34.00, 25, 10], // Calpol 650
      [1, 3, 29.00, 3, 5],   // Pacimol 650 (Low stock!)
      [1, 4, 210.00, 30, 8], // Augmentin 625 Duo
      [1, 5, 175.00, 18, 5], // Moxikind-CV 625
      [1, 7, 65.00, 50, 15], // Glycomet 500
      [1, 9, 115.00, 22, 5], // Atorva 10
      [1, 11, 155.00, 35, 10], // Pan 40
      [1, 13, 195.00, 20, 5], // Montair LC
      [1, 15, 125.00, 14, 5], // Azithral 500
      [1, 17, 145.00, 12, 4], // Asthalin Inhaler

      // MedPlus Healthcare (ID: 2)
      [2, 1, 30.00, 60, 10], // Dolo 650 (Cheaper)
      [2, 2, 33.50, 4, 5],   // Calpol 650 (Low stock!)
      [2, 4, 205.00, 22, 6], // Augmentin 625 Duo
      [2, 6, 185.00, 15, 5], // Clavam 625
      [2, 7, 62.00, 40, 10], // Glycomet 500
      [2, 8, 58.00, 0, 5],   // Obimet 500 (Out of stock!)
      [2, 9, 110.00, 19, 5], // Atorva 10
      [2, 10, 98.00, 15, 5], // Storvas 10
      [2, 11, 150.00, 28, 8], // Pan 40
      [2, 12, 142.00, 20, 5], // Pantocid 40
      [2, 13, 190.00, 16, 5], // Montair LC
      [2, 14, 180.00, 25, 5], // Telekast-L
      [2, 15, 120.00, 18, 5], // Azithral 500
      [2, 17, 140.00, 8, 3],  // Asthalin Inhaler

      // Wellness Forever (ID: 3)
      [3, 1, 33.00, 55, 10], // Dolo 650
      [3, 2, 35.00, 30, 8],  // Calpol 650
      [3, 4, 215.00, 14, 5], // Augmentin 625 Duo
      [3, 5, 180.00, 20, 5], // Moxikind-CV 625
      [3, 7, 68.00, 35, 10], // Glycomet 500
      [3, 9, 120.00, 25, 6], // Atorva 10
      [3, 11, 160.00, 40, 10], // Pan 40
      [3, 13, 200.00, 22, 5], // Montair LC
      [3, 15, 130.00, 15, 5], // Azithral 500
      [3, 16, 115.00, 24, 6], // Azee 500
      [3, 17, 150.00, 15, 4], // Asthalin Inhaler
      [3, 18, 320.00, 10, 3], // Budecort 200 Inhaler

      // HealthKart Pharmacy (ID: 4)
      [4, 1, 29.50, 70, 15], // Dolo 650 (Lowest price!)
      [4, 3, 28.00, 35, 10], // Pacimol 650
      [4, 4, 202.00, 18, 5], // Augmentin 625 Duo
      [4, 7, 60.00, 45, 10], // Glycomet 500
      [4, 9, 108.00, 30, 8], // Atorva 10
      [4, 11, 148.00, 32, 8], // Pan 40
      [4, 13, 188.00, 20, 5], // Montair LC
      [4, 17, 138.00, 16, 5]  // Asthalin Inhaler
    ] : [];

    for (const inv of inventoryData) {
      await conn.query(
        'INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, price, quantity, min_stock_level) VALUES (?, ?, ?, ?, ?)',
        inv
      );
    }
    console.log(`Seeded ${inventoryData.length} inventory records.`);

    // 6. Seed Reservations
    const reservationsData = seedDemoPharmacies ? [
      [
        'MF-RES-84920',
        7, // Rahul Sharma (Patient ID 7)
        1, // Apollo Central
        1, // Dolo 650
        2,
        32.50,
        65.00,
        'Ready for Pickup',
        'Severe viral fever since yesterday, please keep ready.',
        'Prescription verified. Kept at counter 2.',
        new Date(Date.now() - 3600000 * 4) // 4 hours ago
      ],
      [
        'MF-RES-84921',
        7, // Rahul Sharma
        2, // MedPlus
        4, // Augmentin 625 Duo
        1,
        205.00,
        205.00,
        'Pending',
        'Have doctor prescription on phone.',
        null,
        new Date(Date.now() - 3600000 * 1) // 1 hour ago
      ],
      [
        'MF-RES-72314',
        8, // Priya Patel (Patient ID 8)
        1, // Apollo Central
        7, // Glycomet 500
        3,
        65.00,
        195.00,
        'Completed',
        'Monthly diabetes medication refill.',
        'Dispensed on 14 Nov 2026.',
        new Date(Date.now() - 86400000 * 2) // 2 days ago
      ],
      [
        'MF-RES-91823',
        9, // Anita Deshmukh (Patient ID 9)
        3, // Wellness Forever
        17, // Asthalin Inhaler
        1,
        150.00,
        150.00,
        'Confirmed',
        'Urgent asthma inhaler requirement.',
        'Reserved. Available for 24 hours.',
        new Date(Date.now() - 3600000 * 6) // 6 hours ago
      ],
      [
        'MF-RES-61902',
        8, // Priya Patel
        2, // MedPlus
        11, // Pan 40
        2,
        150.00,
        300.00,
        'Cancelled',
        'Ordered alternative instead.',
        'Reservation cancelled by patient.',
        new Date(Date.now() - 86400000 * 5) // 5 days ago
      ]
    ] : [];

    for (const r of reservationsData) {
      await conn.query(
        `INSERT INTO reservations (
          reservation_code, patient_id, pharmacy_id, medicine_id,
          quantity, unit_price, total_price, status, patient_notes,
          pharmacy_notes, reserved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r
      );
    }
    console.log(`Seeded ${reservationsData.length} sample reservations.`);

    // 7. Seed Search Logs
    const searchLogsData = [
      [seededUserIds['patient@medifind.com'], 'Dolo 650', 'Pain Relief & Fever', 4, new Date(Date.now() - 3600000 * 5)],
      [seededUserIds['patient@medifind.com'], 'Augmentin 625', 'Antibiotics & Anti-infectives', 3, new Date(Date.now() - 3600000 * 2)],
      [seededUserIds['priya.patel@medifind.com'], 'Glycomet 500', 'Diabetes Care', 3, new Date(Date.now() - 86400000 * 3)],
      [seededUserIds['anita.deshmukh@medifind.com'], 'Asthalin', 'Respiratory & Asthma', 3, new Date(Date.now() - 3600000 * 7)],
      [null, 'Paracetamol', 'Pain Relief & Fever', 4, new Date(Date.now() - 3600000 * 12)],
      [null, 'Atorva 10', 'Cardiovascular & BP', 4, new Date(Date.now() - 86400000 * 1)],
      [null, 'Montair LC', 'Allergy & Antihistamines', 3, new Date(Date.now() - 3600000 * 18)]
    ];

    for (const s of searchLogsData) {
      await conn.query(
        'INSERT INTO search_logs (patient_id, query, category, results_count, searched_at) VALUES (?, ?, ?, ?, ?)',
        s
      );
    }
    console.log(`Seeded ${searchLogsData.length} search logs.`);

    conn.release();
    console.log('✅ MediFind Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Seeding Failed:', error);
    process.exit(1);
  }
}

seed();

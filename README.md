# MediFind – Intelligent Medicine Discovery & Reservation Platform

MediFind is a modern, full-stack healthcare web application designed to connect patients with nearby licensed pharmacies. It enables real-time medicine discovery, stock availability verification, transparent price comparison, and in-person pickup reservations.

---

## 🌟 Key Features

### 1. Intelligent Medicine Discovery
- **Multi-Parameter Search**: Search by medicine brand name (e.g. *Dolo 650*, *Augmentin 625 Duo*), generic formulation (*Paracetamol*, *Amoxicillin + Clavulanic Acid*), active ingredient, or medical category.
- **Instant Autocomplete Suggestions**: Dynamic debounced typeahead suggestions displaying dosage forms and active ingredients.
- **Verified Bio-Equivalent Alternatives**: Automatic discovery of alternative brands containing the identical active ingredient, strength, and dosage form. Includes mandatory medical notices advising patients to consult qualified doctors before substituting.

### 2. Geographic Pharmacy Discovery & Interactive Map
- **Location-Based Discovery**: Calculates proximity using the Haversine formula based on patient coordinates or area selection.
- **Interactive OpenStreetMap with Leaflet**: Visual interactive map with custom pins for verified pharmacies, live pricing tags, stock indicators, and patient search origin.
- **Stock Transparency**: Automatically calculated stock status:
  - `Available` (Stock > Safety Threshold)
  - `Low Stock` (Stock ≤ Minimum Stock Level)
  - `Out of Stock` (Stock = 0)

### 3. Frictionless Medicine Reservation
- **24-Hour In-Store Hold**: Patients reserve medicines with quantity selection and optional notes without requiring online payments.
- **Unique Reservation ID**: Generates a tamper-proof code (e.g. `MF-RES-84920`) for quick counter lookup.
- **Safety Guards**: System strictly prevents reserving quantities that exceed currently available shelf inventory.
- **Direct Counter Fulfillment**: Patients settle payments directly at the counter upon physical collection with valid prescription verification.

### 4. Role-Based Dashboards & Portals

| Role | Features & Capabilities |
| :--- | :--- |
| **Patient** | Discovery & search, interactive map view, medicine reservations, real-time status tracking, cancellation controls, and profile management. |
| **Pharmacy Owner** | Digital inventory management (add/edit stock, price, min levels), reservation order fulfillment (Accept, Ready for Pickup, Dispense), analytics charts, and store profile. |
| **Administrator** | Pharmacy license verification & approval workflow, global medicine catalog management, platform-wide reservation audit logs, and patient account management. |

---

## 🛠️ Technology Stack

- **Frontend**:
  - React.js (ES6+ JavaScript)
  - Vite
  - React Router DOM
  - Axios
  - Lucide React (Icons)
  - Leaflet & OpenStreetMap
  - Pure CSS3 Design System (Teal `#0F766E`, Soft Blue `#0284C7`, Charcoal, Mint Green accent)
  - *No Tailwind, Bootstrap, or Material UI used as per instructions.*

- **Backend**:
  - Node.js & Express.js
  - RESTful API Architecture
  - JWT Authentication & Role-Based Middleware
  - bcrypt password hashing
  - Morgan logging & CORS configuration

- **Database**:
  - MySQL with `mysql2/promise` connection pool
  - Fully normalized relational schema (`users`, `pharmacies`, `categories`, `medicines`, `pharmacy_inventory`, `reservations`, `search_logs`)
  - Foreign key constraints, indexing on brand names, generic formulations, and reservation codes.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- MySQL (Running on port 3306 or via `/tmp/mysql.sock`)

### 2. Database Initialization
```bash
# Apply schema and seed rich realistic data
mysql -u root < database/schema.sql
cd server && npm run db:seed
```

### 3. Run Application
```bash
# Terminal 1: Start Backend API (Port 5001)
cd server
npm start

# Terminal 2: Start Frontend Development Server (Port 5173)
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Login Available)

The default database seed creates patient and administrator demo accounts plus one shop-owner demo account with a pending, non-public pharmacy. Real pharmacy owners must register their stores, and an administrator must approve each store before it appears in discovery.

You can use the **Demo Logins** dropdown in the top navigation bar for instant role-based access:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@medifind.com` | `Patient@123` | Rahul Sharma (Active reservations) |
| **Shop Owner** | `apollocentral@medifind.com` | `Pharmacy@123` | MediFind Demo Pharmacy (Pending approval) |
| **Administrator** | `admin@medifind.com` | `Admin@123` | System Administrator (Full control) |

For isolated development only, set `SEED_DEMO_PHARMACIES=true` before running the seed script to include fictional pharmacy accounts and listings. Seeding truncates and rebuilds the database; never run it against production data.

---

## 📁 Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/          # SVG & CSS Bar & Donut charts
│   │   │   ├── common/          # Navbar, Footer, Modal, Alert, ProtectedRoute
│   │   │   ├── map/             # Leaflet OpenStreetMap integration
│   │   │   ├── reservations/    # Reservation Modal & Card
│   │   │   └── search/          # SearchBar, FilterPanel, MedicineCard, PharmacyStockCard
│   │   ├── context/             # AuthContext (JWT, session, demo accounts)
│   │   ├── pages/
│   │   │   ├── admin/           # Admin Dashboard, Pharmacies, Medicines, Reservations
│   │   │   ├── auth/            # Login, Patient Register, Pharmacy Register
│   │   │   ├── patient/         # Patient Dashboard, Reservations, Profile
│   │   │   ├── pharmacy/        # Pharmacy Dashboard, Inventory, Orders, Profile
│   │   │   ├── AboutPage.jsx
│   │   │   ├── FindMedicinesPage.jsx
│   │   │   ├── HowItWorksPage.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   └── MedicineDetailPage.jsx
│   │   ├── services/            # Axios API client
│   │   ├── App.jsx              # Application routing & layout
│   │   ├── index.css            # MediFind design system & CSS variables
│   │   └── main.jsx
│   └── package.json
├── database/
│   ├── schema.sql               # MySQL DDL table schema
│   └── seed.sql                 # Sample SQL dump
├── server/
│   ├── src/
│   │   ├── config/db.js         # MySQL connection pool
│   │   ├── controllers/         # Auth, Medicine, Pharmacy, Reservation, Admin
│   │   ├── database/seed.js     # Realistic healthcare seed generator
│   │   ├── middleware/auth.js   # JWT verification & role authorization
│   │   ├── routes/              # Express API routers
│   │   └── index.js             # Express application entry point
│   ├── .env.example
│   └── package.json
└── package.json
```

---

## ⚖️ Medical & Regulatory Disclaimer
MediFind is an intelligent medicine discovery and reservation facilitation platform. MediFind is **not** an online pharmacy and does not sell or deliver prescription medications. In-person pickup requires physical consultation with a dispensing pharmacist and presentation of a valid doctor's prescription where required by law.

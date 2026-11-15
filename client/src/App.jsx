import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import FindMedicinesPage from './pages/FindMedicinesPage';
import MedicineDetailPage from './pages/MedicineDetailPage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PharmacyRegisterPage from './pages/auth/PharmacyRegisterPage';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientReservationsPage from './pages/patient/PatientReservationsPage';
import PatientProfilePage from './pages/patient/PatientProfilePage';

// Pharmacy Pages
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import InventoryManagementPage from './pages/pharmacy/InventoryManagementPage';
import PharmacyReservationsPage from './pages/pharmacy/PharmacyReservationsPage';
import PharmacyProfilePage from './pages/pharmacy/PharmacyProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPharmaciesPage from './pages/admin/AdminPharmaciesPage';
import AdminMedicinesPage from './pages/admin/AdminMedicinesPage';
import AdminReservationsPage from './pages/admin/AdminReservationsPage';
import AdminPatientsPage from './pages/admin/AdminPatientsPage';

export default function App() {
  return (
    <>
      <Navbar />
      <div className="app-content">
        <Routes>
          {/* Public Navigation */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/medicines" element={<FindMedicinesPage />} />
          <Route path="/medicines/:id" element={<MedicineDetailPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/pharmacy" element={<PharmacyRegisterPage />} />

          {/* Patient Protected Routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/reservations"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Pharmacy Owner Protected Routes */}
          <Route
            path="/pharmacy/dashboard"
            element={
              <ProtectedRoute allowedRoles={['pharmacy_owner']}>
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/inventory"
            element={
              <ProtectedRoute allowedRoles={['pharmacy_owner']}>
                <InventoryManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/reservations"
            element={
              <ProtectedRoute allowedRoles={['pharmacy_owner']}>
                <PharmacyReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/profile"
            element={
              <ProtectedRoute allowedRoles={['pharmacy_owner']}>
                <PharmacyProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pharmacies"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPharmaciesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/medicines"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMedicinesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reservations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPatientsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

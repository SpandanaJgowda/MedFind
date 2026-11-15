import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%' }}></div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Verifying MediFind session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const dashboardByRole = {
      patient: '/patient/dashboard',
      pharmacy_owner: '/pharmacy/dashboard',
      admin: '/admin/dashboard'
    };

    return <Navigate to={dashboardByRole[user.role] || '/'} replace />;
  }

  return children;
}

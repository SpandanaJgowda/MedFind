import React, { useState, useEffect, useRef } from 'react';
import { Store, MapPin, Phone, Clock, FileText, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services/api';
import { geocodeIndianAddress } from '../../services/location';
import Alert from '../../components/common/Alert';
import './PharmacyDashboard.css';

export default function PharmacyProfilePage() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.pharmacy?.name || '',
    phone: user?.pharmacy?.phone || '',
    address: user?.pharmacy?.address || '',
    city: user?.pharmacy?.city || '',
    state: user?.pharmacy?.state || '',
    pincode: user?.pharmacy?.pincode || '',
    openingHours: user?.pharmacy?.opening_hours || '08:00 AM - 10:00 PM',
    reservationHoldHours: user?.pharmacy?.reservation_hold_hours || 24,
    latitude: '',
    longitude: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const originalAddressRef = useRef(null);

  useEffect(() => {
    async function loadPharmDetails() {
      if (user?.pharmacy_id) {
        try {
          const res = await pharmacyService.getById(user.pharmacy_id);
          if (res.data.success && res.data.data) {
            const p = res.data.data;
            setFormData({
              name: p.name || '',
              phone: p.phone || '',
              address: p.address || '',
              city: p.city || '',
              state: p.state || '',
              pincode: p.pincode || '',
              openingHours: p.opening_hours || '08:00 AM - 10:00 PM',
              reservationHoldHours: p.reservation_hold_hours || 24,
              latitude: p.latitude || '',
              longitude: p.longitude || ''
            });
            originalAddressRef.current = {
              address: p.address || '',
              city: p.city || '',
              state: p.state || '',
              pincode: p.pincode || ''
            };
          }
        } catch (err) {
          console.error('Failed to load pharmacy details:', err);
        }
      }
    }
    loadPharmDetails();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);

    try {
      const addressChanged = originalAddressRef.current &&
        ['address', 'city', 'state', 'pincode'].some(key => originalAddressRef.current[key] !== formData[key]);
      const validCoordinates = Number.isFinite(Number.parseFloat(formData.latitude)) &&
        Number.isFinite(Number.parseFloat(formData.longitude));
      const updatedData = addressChanged || !validCoordinates
        ? { ...formData, ...await geocodeIndianAddress(formData) }
        : formData;
      const res = await pharmacyService.updateProfile(updatedData);
      if (res.data.success) {
        setFormData(updatedData);
        originalAddressRef.current = {
          address: updatedData.address,
          city: updatedData.city,
          state: updatedData.state,
          pincode: updatedData.pincode
        };
        setAlert({ type: 'success', message: 'Pharmacy store details updated successfully.' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || err.message || 'Failed to update pharmacy profile.' });
    } finally {
      setIsLoading(false);
    }
  };

  const isApproved = user?.pharmacy?.approval_status === 'approved' || user?.approval_status === 'approved';

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '780px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
          Pharmacy Store Profile
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '4px' }}>
          Manage your public pharmacy listing, operating hours, and location for patient discovery.
        </p>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* License Card */}
      <div className="card" style={{ padding: '24px', marginBottom: '28px', backgroundColor: '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
              State Drug Control License
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '2px' }}>
              {user?.pharmacy?.license_number || 'KA-BLR-PH-REGISTERED'}
            </div>
          </div>
          <div>
            {isApproved ? (
              <span className="badge badge-success">
                <ShieldCheck size={14} />
                <span>Verified & Approved</span>
              </span>
            ) : (
              <span className="badge badge-warning">
                Pending Verification
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Card */}
      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Pharmacy Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row-3col">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                className="form-input"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">PIN Code</label>
              <input
                type="text"
                name="pincode"
                className="form-input"
                value={formData.pincode}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Operating Hours</label>
            <input
              type="text"
              name="openingHours"
              className="form-input"
              value={formData.openingHours}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Latitude Coordinate</label>
              <input
                type="text"
                name="latitude"
                className="form-input"
                placeholder="Store latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Longitude Coordinate</label>
              <input
                type="text"
                name="longitude"
                className="form-input"
                placeholder="Store longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Medicine Hold Duration (hours)</label>
            <input
              type="number"
              name="reservationHoldHours"
              className="form-input"
              min="1"
              max="168"
              value={formData.reservationHoldHours}
              onChange={handleChange}
              required
            />
            <span className="form-help-text">Confirmed bookings expire automatically after this period (1-168 hours).</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ marginTop: '12px' }}
          >
            {isLoading ? 'Saving...' : 'Save Pharmacy Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

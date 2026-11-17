import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Store, User, Mail, Phone, Lock, MapPin, Clock, FileText, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { geocodeIndianAddress } from '../../services/location';
import Alert from '../../components/common/Alert';
import './Auth.css';

export default function PharmacyRegisterPage() {
  const { registerPharmacy } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    pharmacyName: '',
    ownerName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    openingHours: '08:00 AM - 10:00 PM',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const coordinates = await geocodeIndianAddress(formData);
      const res = await registerPharmacy({ ...formData, ...coordinates });
      if (res.success) {
        setRegisteredSuccess(true);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server error during pharmacy registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-box pharmacy-register-box">
        <div className="auth-header">
          <Link to="/" className="auth-brand-logo">
            <div className="brand-icon">
              <Pill size={22} />
            </div>
            <span className="brand-name">Medi<span className="brand-highlight">Find</span></span>
          </Link>
          <h2 className="auth-title">Register Your Pharmacy</h2>
          <p className="auth-subtitle">
            List your inventory, receive patient reservations, and expand your neighborhood customer base.
          </p>
        </div>

        {/* Administrator Approval Notice */}
        <div className="approval-notice-card">
          <ShieldCheck size={20} className="notice-icon" />
          <div className="notice-text">
            <strong>Administrator Verification Required:</strong>
            <p>
              To protect patient safety, all pharmacy registrations require administrator verification of the State Drug Control License before inventory is publicly visible.
            </p>
          </div>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

        {registeredSuccess ? (
          <div className="pharmacy-reg-success">
            <div className="success-icon-badge">
              <ShieldCheck size={48} className="text-primary" />
            </div>
            <h3>Registration Submitted!</h3>
            <p>
              Thank you for registering <strong>{formData.pharmacyName}</strong> with MediFind. Your license <strong>{formData.licenseNumber}</strong> is currently pending administrative verification.
            </p>
            <p className="reg-hint">
              You can log in now to configure your inventory and store profile. Your inventory will become publicly discoverable once approved.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/pharmacy/dashboard')}
            >
              Go to Pharmacy Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-section-title">1. Pharmacy Credentials</div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Pharmacy Name</label>
                <div className="input-with-icon">
                  <Store size={18} className="input-left-icon" />
                  <input
                    type="text"
                    name="pharmacyName"
                    className="form-input"
                    placeholder="e.g. LifeCare Chemists & Druggists"
                    value={formData.pharmacyName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pharmacy License Number</label>
                <div className="input-with-icon">
                  <FileText size={18} className="input-left-icon" />
                  <input
                    type="text"
                    name="licenseNumber"
                    className="form-input"
                    placeholder="e.g. KA-BLR-PH-2024-8891"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Owner / Pharmacist Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-left-icon" />
                  <input
                    type="text"
                    name="ownerName"
                    className="form-input"
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Store Phone Number</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-left-icon" />
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    placeholder="+91 80 2558 4411"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section-title">2. Location & Operating Hours</div>
            <p className="form-help-text">We locate the store from this address so patients see accurate nearby results.</p>

            <div className="form-group">
              <label className="form-label">Complete Street Address</label>
              <div className="input-with-icon">
                <MapPin size={18} className="input-left-icon" />
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  placeholder="Shop No. 12, Ground Floor, 100ft Road"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
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
              <label className="form-label">Opening & Closing Hours</label>
              <div className="input-with-icon">
                <Clock size={18} className="input-left-icon" />
                <input
                  type="text"
                  name="openingHours"
                  className="form-input"
                  placeholder="e.g. 08:00 AM - 11:00 PM or 24 Hours Open"
                  value={formData.openingHours}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-section-title">3. Account Credentials</div>

            <div className="form-group">
              <label className="form-label">Owner / Business Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-left-icon" />
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="pharmacy@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-left-icon" />
                  <input
                    type="password"
                    name="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-left-icon" />
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-input"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block auth-submit-btn"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Submitting Registration...' : 'Submit Pharmacy Registration'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        <div className="auth-footer-links">
          <p>
            Already registered?{' '}
            <Link to="/login" className="auth-link">
              Sign In to Pharmacy Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

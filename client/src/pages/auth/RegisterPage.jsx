import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, User, Mail, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/common/Alert';
import './Auth.css';

export default function RegisterPage() {
  const { registerPatient } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const res = await registerPatient(formData);
      if (res.success) {
        navigate('/patient/dashboard');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-box register-box">
        <div className="auth-header">
          <Link to="/" className="auth-brand-logo">
            <div className="brand-icon">
              <Pill size={22} />
            </div>
            <span className="brand-name">Medi<span className="brand-highlight">Find</span></span>
          </Link>
          <h2 className="auth-title">Create Patient Account</h2>
          <p className="auth-subtitle">
            Find medicines, check real-time stock and reserve items for instant counter pickup.
          </p>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-left-icon" />
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-left-icon" />
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="rahul@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div className="input-with-icon">
              <Phone size={18} className="input-left-icon" />
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="+91 98765 43210"
                value={formData.phone}
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
            <span>{isLoading ? 'Creating Account...' : 'Complete Patient Registration'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer-links">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
          <div className="auth-divider">or</div>
          <p>
            Own a licensed pharmacy?{' '}
            <Link to="/register/pharmacy" className="auth-link font-bold">
              Join as Pharmacy Partner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Pill, Mail, Lock, ArrowRight, User, Store, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/common/Alert';
import './Auth.css';

export default function LoginPage() {
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigateAfterLogin = (authenticatedUser) => {
    const dashboardByRole = {
      patient: '/patient/dashboard',
      pharmacy_owner: '/pharmacy/dashboard',
      admin: '/admin/dashboard'
    };
    const from = location.state?.from;
    const resumeReservation = location.state?.resumeReservation;

    if (resumeReservation && authenticatedUser.role !== 'patient') {
      navigate(dashboardByRole[authenticatedUser.role] || '/', { replace: true });
      return;
    }

    if (from?.pathname?.startsWith('/') && !from.pathname.startsWith('//')) {
      navigate(`${from.pathname}${from.search || ''}${from.hash || ''}`, {
        replace: true,
        state: resumeReservation ? { resumeReservation } : from.state
      });
      return;
    }

    navigate(dashboardByRole[authenticatedUser.role] || '/', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigateAfterLogin(res.user);
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection error during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await quickDemoLogin(role);
      if (res.success) {
        navigateAfterLogin(res.user);
      }
    } catch (err) {
      setError('Failed to log in with demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-box">
        {/* Brand header */}
        <div className="auth-header">
          <Link to="/" className="auth-brand-logo">
            <div className="brand-icon">
              <Pill size={22} />
            </div>
            <span className="brand-name">Medi<span className="brand-highlight">Find</span></span>
          </Link>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">
            Sign in to manage your medicine reservations or pharmacy inventory.
          </p>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

        {/* Demo Accounts Quick-Select */}
        <div className="demo-accounts-panel">
          <div className="demo-panel-title">
            <Sparkles size={14} />
            <span>Instant Demo Sign In (1-Click)</span>
          </div>
          <div className="demo-buttons-group">
            <button
              type="button"
              className="btn-demo-pill role-pat"
              onClick={() => handleDemo('patient')}
            >
              <User size={14} />
              <span>Patient</span>
            </button>
            <button
              type="button"
              className="btn-demo-pill role-pharm"
              onClick={() => handleDemo('pharmacy_owner')}
            >
              <Store size={14} />
              <span>Shop Owner</span>
            </button>
            <button
              type="button"
              className="btn-demo-pill role-adm"
              onClick={() => handleDemo('admin')}
            >
              <Shield size={14} />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-left-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="password-label-row">
              <label className="form-label">Password</label>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-left-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block auth-submit-btn"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer-links">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create Patient Account
            </Link>
          </p>
          <div className="auth-divider">or</div>
          <p>
            Are you a pharmacy owner?{' '}
            <Link to="/register/pharmacy" className="auth-link font-bold">
              Register Your Pharmacy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

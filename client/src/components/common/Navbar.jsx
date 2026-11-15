import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Pill, 
  Search, 
  MapPin, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Shield, 
  Store, 
  CalendarCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const handleDemoLogin = async (role) => {
    setDemoMenuOpen(false);
    const res = await quickDemoLogin(role);
    if (res.success) {
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'pharmacy_owner') navigate('/pharmacy/dashboard');
      else navigate('/patient/dashboard');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Pill size={22} className="brand-svg" />
          </div>
          <div className="brand-text">
            <span className="brand-name">Medi<span className="brand-highlight">Find</span></span>
            <span className="brand-tagline">Discovery & Reservation</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/medicines" className={`nav-link ${isActive('/medicines') ? 'active' : ''}`}>
            Find Medicines
          </Link>
          <Link to="/how-it-works" className={`nav-link ${isActive('/how-it-works') ? 'active' : ''}`}>
            How It Works
          </Link>
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>
            About Us
          </Link>
        </div>

        {/* Action Controls & User Profiles */}
        <div className="navbar-actions">
          {/* Quick Demo Switcher Dropdown */}
          <div className="demo-dropdown-wrapper">
            <button 
              className="btn-demo-trigger"
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                title="One-click demo login for all roles"
            >
              <Sparkles size={16} />
              <span>Demo Logins</span>
              <ChevronDown size={14} />
            </button>

            {demoMenuOpen && (
              <div className="demo-dropdown-menu">
                <div className="demo-header">Switch Demo Role</div>
                <button onClick={() => handleDemoLogin('patient')} className="demo-item">
                  <User size={16} className="text-primary" />
                  <div>
                    <div className="demo-title">Patient Demo</div>
                    <div className="demo-sub">Rahul Sharma (Discover & Reserve)</div>
                  </div>
                </button>
                <button onClick={() => handleDemoLogin('pharmacy_owner')} className="demo-item">
                  <Store size={16} className="text-secondary" />
                  <div>
                    <div className="demo-title">Shop Owner Demo</div>
                    <div className="demo-sub">MediFind Demo Pharmacy (Pending Approval)</div>
                  </div>
                </button>
                <button onClick={() => handleDemoLogin('admin')} className="demo-item">
                  <Shield size={16} className="text-warning" />
                  <div>
                    <div className="demo-title">Admin Demo</div>
                    <div className="demo-sub">System Administrator (Full Control)</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="user-menu-wrapper">
              <button 
                className="user-profile-button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info-text">
                  <span className="user-display-name">{user.name.split(' ')[0]}</span>
                  <span className={`user-role-badge role-${user.role}`}>
                    {user.role === 'pharmacy_owner' ? 'Pharmacy' : user.role}
                  </span>
                </div>
                <ChevronDown size={14} className="user-dropdown-arrow" />
              </button>

              {userDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <p className="user-name-full">{user.name}</p>
                    <p className="user-email-full">{user.email}</p>
                  </div>

                  {user.role === 'patient' && (
                    <>
                      <Link to="/patient/dashboard" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <User size={16} />
                        <span>My Dashboard</span>
                      </Link>
                      <Link to="/patient/reservations" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <CalendarCheck size={16} />
                        <span>My Reservations</span>
                      </Link>
                      <Link to="/patient/profile" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <User size={16} />
                        <span>Profile Settings</span>
                      </Link>
                    </>
                  )}

                  {user.role === 'pharmacy_owner' && (
                    <>
                      <Link to="/pharmacy/dashboard" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Store size={16} />
                        <span>Pharmacy Dashboard</span>
                      </Link>
                      <Link to="/pharmacy/inventory" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Pill size={16} />
                        <span>Manage Inventory</span>
                      </Link>
                      <Link to="/pharmacy/reservations" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <CalendarCheck size={16} />
                        <span>Incoming Reservations</span>
                      </Link>
                      <Link to="/pharmacy/profile" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Store size={16} />
                        <span>Pharmacy Profile</span>
                      </Link>
                    </>
                  )}

                  {user.role === 'admin' && (
                    <>
                      <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Shield size={16} />
                        <span>Admin Dashboard</span>
                      </Link>
                      <Link to="/admin/pharmacies" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Store size={16} />
                        <span>Manage Pharmacies</span>
                      </Link>
                      <Link to="/admin/medicines" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Pill size={16} />
                        <span>Medicine Catalog</span>
                      </Link>
                      <Link to="/admin/reservations" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <CalendarCheck size={16} />
                        <span>Platform Reservations</span>
                      </Link>
                    </>
                  )}

                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout-item">
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-links">
            <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/medicines" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Find Medicines
            </Link>
            <Link to="/how-it-works" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </Link>
            <Link to="/about" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
              About Us
            </Link>

            <div className="mobile-divider"></div>

            {isAuthenticated ? (
              <>
                {user.role === 'patient' && (
                  <>
                    <Link to="/patient/dashboard" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Patient Dashboard
                    </Link>
                    <Link to="/patient/reservations" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      My Reservations
                    </Link>
                  </>
                )}
                {user.role === 'pharmacy_owner' && (
                  <>
                    <Link to="/pharmacy/dashboard" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Pharmacy Dashboard
                    </Link>
                    <Link to="/pharmacy/inventory" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Inventory Management
                    </Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    Admin Control Center
                  </Link>
                )}
                <button onClick={handleLogout} className="mobile-link logout-btn">
                  Log Out
                </button>
              </>
            ) : (
              <div className="mobile-auth-stack">
                <Link to="/login" className="btn btn-outline" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                  Patient Register
                </Link>
                <Link to="/register/pharmacy" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                  Join as Pharmacy
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

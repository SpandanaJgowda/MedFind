import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, Phone, Mail, MapPin, ShieldCheck, Heart, ExternalLink } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      {/* Medical Disclaimer Banner */}
      <div className="footer-disclaimer-banner">
        <div className="container disclaimer-content">
          <ShieldCheck size={20} className="disclaimer-icon" />
          <p>
            <strong>Medical Notice:</strong> MediFind is a discovery and in-person pickup reservation platform connecting patients with licensed local pharmacies. MediFind does not sell medicines directly or provide medical advice. Prescription medications require a valid physical or digital doctor's prescription upon collection at the pharmacy.
          </p>
        </div>
      </div>

      <div className="container footer-main">
        <div className="footer-grid">
          {/* Col 1: About & Brand */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="brand-icon">
                <Pill size={22} />
              </div>
              <span className="brand-name">Medi<span className="brand-highlight">Find</span></span>
            </div>
            <p className="brand-desc">
              Empowering patients with real-time medicine availability, price transparency, and seamless pharmacy reservation to eliminate painful pharmacy hopping.
            </p>
            <div className="contact-items">
              <div className="contact-item">
                <MapPin size={16} />
                <span>MG Road, Bengaluru, Karnataka 560001</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>+91 800 555 4321 (Toll-Free Helpline)</span>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <span>support@medifind.health</span>
              </div>
            </div>
          </div>

          {/* Col 2: For Patients */}
          <div className="footer-col">
            <h4 className="footer-heading">For Patients</h4>
            <ul className="footer-links">
              <li><Link to="/medicines">Search Medicines</Link></li>
              <li><Link to="/how-it-works">How Reservation Works</Link></li>
              <li><Link to="/medicines?category=pain-relief">Pain Relief & Fever</Link></li>
              <li><Link to="/medicines?category=antibiotics">Antibiotics & Infection</Link></li>
              <li><Link to="/medicines?category=diabetes-care">Diabetes Management</Link></li>
              <li><Link to="/medicines?category=cardiovascular">Heart & BP Medications</Link></li>
            </ul>
          </div>

          {/* Col 3: For Pharmacies */}
          <div className="footer-col">
            <h4 className="footer-heading">For Pharmacies</h4>
            <ul className="footer-links">
              <li><Link to="/register/pharmacy">Register Your Pharmacy</Link></li>
              <li><Link to="/login">Pharmacy Partner Login</Link></li>
              <li><Link to="/how-it-works#pharmacy-benefits">Inventory Management</Link></li>
              <li><Link to="/how-it-works#pickup-verification">Pickup Verification</Link></li>
              <li><a href="#compliance" onClick={(e) => e.preventDefault()}>Compliance & Licensing</a></li>
            </ul>
          </div>

          {/* Col 4: Platform & Legal */}
          <div className="footer-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/about">About MediFind</Link></li>
              <li><Link to="/login">Admin Portal</Link></li>
              <li><a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a></li>
              <li><a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a></li>
              <li><a href="#faq" onClick={(e) => e.preventDefault()}>Help & FAQs</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} MediFind Platform Inc. Built with care for healthcare accessibility.
          </p>
          <p className="made-with">
            Designed for patients, healthcare workers & local pharmacy communities.
          </p>
        </div>
      </div>
    </footer>
  );
}

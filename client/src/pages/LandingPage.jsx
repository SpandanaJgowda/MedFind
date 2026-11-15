import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Pill, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Store, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  HeartHandshake, 
  Sparkles,
  Users,
  Compass,
  FileCheck
} from 'lucide-react';
import SearchBar from '../components/search/SearchBar';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const quickPills = [
    { label: 'Dolo 650', query: 'Dolo 650' },
    { label: 'Augmentin 625', query: 'Augmentin' },
    { label: 'Glycomet 500', query: 'Glycomet' },
    { label: 'Atorva 10', query: 'Atorva' },
    { label: 'Asthalin Inhaler', query: 'Asthalin' },
    { label: 'Pan 40', query: 'Pan 40' }
  ];

  const faqs = [
    {
      q: 'How does MediFind help me find medicines?',
      a: 'MediFind aggregates real-time inventory from verified local pharmacies in your area. You can search by brand name, generic formulation, or active ingredient, compare prices and stock levels, and reserve the medicine before visiting the store.'
    },
    {
      q: 'Do I pay online for my reserved medicines?',
      a: 'No. MediFind is strictly a medicine discovery and in-person pickup reservation platform. You do not enter credit card details or pay online. Payment is made directly at the physical pharmacy counter when you collect your medication.'
    },
    {
      q: 'Do I need a doctor\'s prescription for reserved medicines?',
      a: 'For all prescription medicines (marked with an Rx badge on the platform), you must present a valid physical or digital prescription from a qualified healthcare practitioner at the pharmacy counter upon pickup.'
    },
    {
      q: 'How long will the pharmacy hold my reservation?',
      a: 'Once confirmed, pharmacies hold reserved items for up to 24 hours. After this window, the pharmacy may release the stock back to the public shelf.'
    },
    {
      q: 'How do pharmacies join the MediFind platform?',
      a: 'Pharmacy owners can register using their valid State Drug Control License number. Once our administrative compliance team verifies the pharmacy credentials, the account is activated to publish inventory.'
    }
  ];

  return (
    <div className="landing-page">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>Intelligent Healthcare Discovery</span>
            </div>

            <h1 className="hero-heading">
              Find Your Medicines. <br />
              <span className="hero-heading-highlight">Reserve with Confidence.</span>
            </h1>

            <p className="hero-subtitle">
              Discover nearby pharmacies, check verified medicine availability and reserve your essential medicines before you visit — zero wasted trips, zero phone calls.
            </p>

            {/* Prominent Search Bar */}
            <div className="hero-search-wrapper">
              <SearchBar placeholder="Search by brand name, generic name, active ingredient (e.g. Dolo, Augmentin, Metformin)..." />
              <div className="hero-quick-tags">
                <span className="tag-label">Popular searches:</span>
                {quickPills.map((p, idx) => (
                  <button
                    key={idx}
                    className="quick-tag-pill"
                    onClick={() => navigate(`/medicines?q=${encodeURIComponent(p.query)}`)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="hero-cta-buttons">
              <Link to="/medicines" className="btn btn-primary btn-lg">
                <span>Find Medicines Now</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/register/pharmacy" className="btn btn-outline btn-lg">
                <Store size={18} />
                <span>Join as Pharmacy</span>
              </Link>
            </div>

            {/* Trust Metrics */}
            <div className="hero-trust-metrics">
              <div className="metric-item">
                <span className="metric-val">100%</span>
                <span className="metric-label">Verified Pharmacies</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <span className="metric-val">24h</span>
                <span className="metric-label">Guaranteed Hold</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <span className="metric-val">₹0</span>
                <span className="metric-label">Reservation Fee</span>
              </div>
            </div>
          </div>

          {/* Hero Healthcare Graphic / Live Preview Card */}
          <div className="hero-visual">
            <div className="visual-card-wrapper">
              {/* Floating Pill Card */}
              <div className="floating-card med-preview-floating">
                <div className="preview-header">
                  <div className="preview-icon">
                    <Pill size={24} />
                  </div>
                  <div>
                    <div className="preview-med-name">Dolo 650 Tablet</div>
                    <div className="preview-med-sub">Paracetamol 650mg • Antipyretic</div>
                  </div>
                </div>
                <div className="preview-stock-banner">
                  <CheckCircle2 size={16} />
                  <span>Available at 4 nearby pharmacies</span>
                </div>
                <div className="preview-price-row">
                  <span>Price from</span>
                  <strong>₹29.50</strong>
                </div>
              </div>

              {/* Floating Pharmacy Card */}
              <div className="floating-card pharm-preview-floating">
                <div className="pharm-header">
                  <Store size={18} className="text-primary" />
                  <strong>Apollo Central Pharmacy</strong>
                </div>
                <div className="pharm-dist">
                  <MapPin size={14} />
                  <span>0.8 km • MG Road</span>
                </div>
                <div className="pharm-res-tag">
                  <ShieldCheck size={14} />
                  <span>Ready for 24h pickup reservation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (Three Steps) */}
      <section className="section how-it-works-section" id="how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">SIMPLE 3-STEP WORKFLOW</span>
            <h2 className="section-title">How MediFind Works</h2>
            <p className="section-desc">
              From finding rare prescriptions to picking them up at your nearest counter in minutes.
            </p>
          </div>

          <div className="steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon-box">
                <Search size={28} />
              </div>
              <h3 className="step-title">Search</h3>
              <p className="step-text">
                Enter the medicine brand name, generic formulation, active ingredient, or medical category.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon-box">
                <Compass size={28} />
              </div>
              <h3 className="step-title">Discover</h3>
              <p className="step-text">
                View verified nearby pharmacies with available stock, real-time prices, distance and opening hours on the map.
              </p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon-box">
                <FileCheck size={28} />
              </div>
              <h3 className="step-title">Reserve</h3>
              <p className="step-text">
                Reserve your medication with a single click. Receive a unique reservation code and collect it when convenient.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="section features-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">INTELLIGENT CAPABILITIES</span>
            <h2 className="section-title">Designed for Fast & Reliable Access</h2>
            <p className="section-desc">
              Every feature is built around saving critical time when locating life-saving medications.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Search size={24} />
              </div>
              <h3 className="feature-title">Smart Medicine Search</h3>
              <p className="feature-desc">
                Intelligent autocomplete matching brand names, generic formulations, and active ingredients with instant suggestions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <MapPin size={24} />
              </div>
              <h3 className="feature-title">Nearby Pharmacy Discovery</h3>
              <p className="feature-desc">
                Geographic discovery calculated with the Haversine formula and interactive OpenStreetMap markers showing distance and hours.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Clock size={24} />
              </div>
              <h3 className="feature-title">Live Inventory Updates</h3>
              <p className="feature-desc">
                Automated status calculation: Available, Low Stock, or Out of Stock, ensuring you know exactly what is on the shelf.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <ShieldCheck size={24} />
              </div>
              <h3 className="feature-title">Easy Medicine Reservation</h3>
              <p className="feature-desc">
                Generate an instant reservation ID (`MF-RES-XXXXX`) that guarantees the pharmacy holds your order for up to 24 hours.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <DollarSign size={24} />
              </div>
              <h3 className="feature-title">Transparent Price Comparison</h3>
              <p className="feature-desc">
                Compare prices across competing local pharmacies side-by-side to ensure affordable, fair healthcare access.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Store size={24} />
              </div>
              <h3 className="feature-title">Pharmacy Digital Management</h3>
              <p className="feature-desc">
                Comprehensive digital dashboard for pharmacy owners to manage inventory, track reservation requests, and update stock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Benefits Section (Patients vs Pharmacies) */}
      <section className="section benefits-section">
        <div className="container">
          <div className="benefits-grid">
            {/* Patient Benefits */}
            <div className="benefit-card patient-benefit">
              <div className="benefit-badge">FOR PATIENTS</div>
              <h3 className="benefit-heading">Never Rush from Pharmacy to Pharmacy Again</h3>
              <ul className="benefit-list">
                <li>
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Verify stock availability before stepping out of your home.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Discover bio-equivalent alternatives with identical active ingredients.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Compare prices and choose the most convenient or cost-effective chemist.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Reserve medications for guaranteed pickup without online payment hassle.</span>
                </li>
              </ul>
              <Link to="/medicines" className="btn btn-primary">
                Search Medicines
              </Link>
            </div>

            {/* Pharmacy Benefits */}
            <div className="benefit-card pharmacy-benefit">
              <div className="benefit-badge badge-sec">FOR PHARMACY OWNERS</div>
              <h3 className="benefit-heading">Expand Your Walk-In Footfall & Streamline Inventory</h3>
              <ul className="benefit-list">
                <li>
                  <CheckCircle2 size={18} className="text-secondary" />
                  <span>Connect with neighborhood patients actively looking for your stock.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="text-secondary" />
                  <span>Automated alerts for low stock and depleted inventory levels.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="text-secondary" />
                  <span>Receive pre-verified reservations ready for quick counter fulfillment.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} className="text-secondary" />
                  <span>Gain actionable analytics on the most searched medicines in your city.</span>
                </li>
              </ul>
              <Link to="/register/pharmacy" className="btn btn-secondary">
                Register Your Pharmacy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="section faq-section" id="faq">
        <div className="container faq-container">
          <div className="section-header text-center">
            <span className="section-eyebrow">GOT QUESTIONS?</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`faq-item ${activeFaq === idx ? 'expanded' : ''}`}>
                <button className="faq-question-btn" onClick={() => toggleFaq(idx)}>
                  <span>{faq.q}</span>
                  {activeFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeFaq === idx && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Join Call to Action Banner */}
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-banner-card">
            <div className="cta-banner-content">
              <h2 className="cta-banner-title">Need to Find an Essential Medication Right Now?</h2>
              <p className="cta-banner-sub">
                Join thousands of patients finding and reserving their medicines with verified nearby pharmacies.
              </p>
              <div className="cta-banner-actions">
                <Link to="/medicines" className="btn btn-primary btn-lg">
                  Find Medicines
                </Link>
                <Link to="/register" className="btn btn-outline btn-lg" style={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}>
                  Create Patient Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

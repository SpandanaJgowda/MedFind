import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  FileCheck, 
  Store, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Pill,
  ArrowRight,
  ShoppingBag,
  FileText
} from 'lucide-react';
import './LandingPage.css';

export default function HowItWorksPage() {
  return (
    <div className="container" style={{ paddingTop: '50px', paddingBottom: '90px' }}>
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px auto' }}>
        <span className="section-eyebrow">PATIENT & PHARMACY GUIDE</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 800, margin: '8px 0 16px 0' }}>
          How MediFind Connects You to Medicines
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
          A step-by-step breakdown of how our medicine availability verification and 24-hour pickup reservation works.
        </p>
      </div>

      {/* 3 Step Deep Dive */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', marginBottom: '60px' }}>
        <div className="card" style={{ padding: '36px', display: 'grid', gridTemplateColumns: '70px 1fr', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={32} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Step 1: Intelligent Search</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '6px 0 12px 0' }}>Search Across Brands, Generics & Active Ingredients</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '14px' }}>
              Whether your doctor wrote a brand name like <em>Augmentin 625</em> or the scientific formulation <em>Amoxicillin + Clavulanic Acid</em>, our intelligent search engine matches verified records instantly. If a specific brand is out of stock, our algorithm highlights verified bio-equivalent alternatives with identical strength and dosage forms.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">Autocomplete Suggestions</span>
              <span className="badge badge-neutral">Partial Matching</span>
              <span className="badge badge-neutral">Active Ingredient Cross-Reference</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '36px', display: 'grid', gridTemplateColumns: '70px 1fr', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={32} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>Step 2: Geographic Discovery</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '6px 0 12px 0' }}>Compare Nearby Stock, Distance & Transparent Pricing</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '14px' }}>
              Our platform lists all licensed pharmacies in your vicinity that have the medicine in physical inventory. Using Leaflet and OpenStreetMap, you can visualize pharmacy locations, check opening hours (such as 24/7 stores), verify phone numbers, and compare retail rates transparently.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-secondary">Haversine Distance Calculation</span>
              <span className="badge badge-neutral">Live Inventory Status</span>
              <span className="badge badge-neutral">Interactive Map Markers</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '36px', display: 'grid', gridTemplateColumns: '70px 1fr', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck size={32} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>Step 3: Counter Pickup Reservation</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '6px 0 12px 0' }}>Hold Your Medicine with a Unique Reservation Code</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '14px' }}>
              Select your preferred pharmacy and reserve the required units. MediFind generates a unique reservation code (e.g. <code>MF-RES-84920</code>) and alerts the pharmacy staff to hold your order for 24 hours. When you visit the counter, show your code, verify your prescription, and pay the chemist directly.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-success">Zero Online Payment</span>
              <span className="badge badge-neutral">Guaranteed 24h Hold</span>
              <span className="badge badge-neutral">Prescription Verification at Counter</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="card text-center" style={{ padding: '48px 24px', background: 'linear-gradient(135deg, #F0FDFA, #FFFFFF)', border: '2px solid var(--color-primary-light)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
          Ready to Experience Friction-Free Medicine Access?
        </h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto 24px auto' }}>
          Search our database of over 18 essential medications across certified pharmacies right now.
        </p>
        <Link to="/medicines" className="btn btn-primary btn-lg">
          <span>Search Medicines Now</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}

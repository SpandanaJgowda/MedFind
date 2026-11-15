import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, HeartHandshake, ShieldCheck, Compass, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import './LandingPage.css';

export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: '50px', paddingBottom: '90px' }}>
      <div style={{ textAlign: 'center', maxWidth: '740px', margin: '0 auto 50px auto' }}>
        <span className="section-eyebrow">OUR MISSION & VISION</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 800, margin: '8px 0 16px 0' }}>
          Bridging the Critical Gap Between Patients & Pharmacies
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
          MediFind was founded on a simple premise: patients should never have to suffer delays or travel store-to-store in distress searching for essential medicines.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '50px' }}>
        <div className="card" style={{ padding: '36px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Compass size={24} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>The Problem We Solve</h3>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            In traditional healthcare ecosystems, medicine availability is decentralized and opaque. When patients receive prescriptions for acute fevers, respiratory inhalers, or chronic diabetes drugs, they often visit multiple local chemists only to hear "stock exhausted." This leads to dangerous treatment delays, unnecessary travel, and patient anxiety.
          </p>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <HeartHandshake size={24} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>Our Solution</h3>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            MediFind provides a unified platform connecting patients with neighborhood pharmacies. By digitizing pharmacy inventories and offering instant in-person pickup reservations, we guarantee that when a patient travels to a chemist, their medicine is verified, held, and waiting for them behind the counter.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '40px', marginBottom: '50px', backgroundColor: '#FFFFFF' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>
          Our Core Operating Principles
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div>
            <ShieldCheck size={28} className="text-primary" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Verified Licensing</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Every pharmacy on MediFind is manually vetted by our compliance team against valid State Drug Control licenses.
            </p>
          </div>

          <div>
            <Users size={28} className="text-secondary" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Community First</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              We empower local independent chemists and trusted pharmacy chains alike, keeping neighborhood healthcare hubs thriving.
            </p>
          </div>

          <div>
            <CheckCircle2 size={28} className="text-success" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Zero In-App Commerce</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              We do not sell medicines or charge reservation commissions. Payment is always settled directly between patient and chemist at the physical counter.
            </p>
          </div>
        </div>
      </div>

      <div className="card text-center" style={{ padding: '40px 20px', background: 'linear-gradient(135deg, var(--color-primary), #0D9488)', color: '#FFFFFF' }}>
        <h3 style={{ color: '#FFFFFF', fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px' }}>
          Are You a Pharmacy Owner?
        </h3>
        <p style={{ color: '#CCFBF1', maxWidth: '520px', margin: '0 auto 20px auto', fontSize: '0.95rem' }}>
          Join MediFind today to list your medicine inventory and serve patients in your local neighborhood.
        </p>
        <Link to="/register/pharmacy" className="btn btn-outline" style={{ backgroundColor: '#FFFFFF', color: 'var(--color-primary)', borderColor: '#FFFFFF' }}>
          Register Your Pharmacy
        </Link>
      </div>
    </div>
  );
}

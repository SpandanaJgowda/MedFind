import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, Building2, Store, CheckCircle2, AlertTriangle, ArrowRight, FileText } from 'lucide-react';
import './MedicineCard.css';

export default function MedicineCard({ medicine, locationSearch = '' }) {
  const hasStock = medicine.pharmacies_in_stock > 0;
  const isSinglePrice = medicine.min_price === medicine.max_price;

  return (
    <div className="card medicine-card">
      <div className="medicine-card-header">
        <div className="med-title-block">
          <div className="med-icon-badge">
            <Pill size={20} />
          </div>
          <div>
            <h3 className="med-brand-name">{medicine.brand_name}</h3>
            <p className="med-generic-name">{medicine.generic_name} ({medicine.strength})</p>
          </div>
        </div>

        <div className="med-badges">
          <span className="badge badge-neutral">{medicine.dosage_form}</span>
          {medicine.prescription_required ? (
            <span className="badge badge-warning" title="Prescription required upon collection">
              <FileText size={12} />
              <span>Rx Required</span>
            </span>
          ) : (
            <span className="badge badge-success">OTC / General</span>
          )}
        </div>
      </div>

      <div className="med-card-body">
        <div className="med-detail-row">
          <span className="detail-label">Active Ingredient:</span>
          <span className="detail-value">{medicine.active_ingredient}</span>
        </div>
        <div className="med-detail-row">
          <span className="detail-label">Manufacturer:</span>
          <span className="detail-value text-truncate">{medicine.manufacturer}</span>
        </div>
        {medicine.category_name && (
          <div className="med-detail-row">
            <span className="detail-label">Category:</span>
            <span className="detail-value">{medicine.category_name}</span>
          </div>
        )}
      </div>

      <div className="med-card-footer">
        <div className="med-availability-block">
          {hasStock ? (
            <>
              <div className="price-tag">
                <span className="price-label">Price from:</span>
                <span className="price-amount">
                  ₹{medicine.min_price}
                  {!isSinglePrice && <span className="price-range"> - ₹{medicine.max_price}</span>}
                </span>
              </div>
              <div className="stock-status in-stock">
                <Store size={14} />
                <span>Available in {medicine.pharmacies_in_stock} nearby {medicine.pharmacies_in_stock === 1 ? 'pharmacy' : 'pharmacies'}</span>
              </div>
            </>
          ) : (
            <div className="stock-status out-of-stock">
              <AlertTriangle size={14} />
              <span>Currently out of stock nearby</span>
            </div>
          )}
        </div>

        <Link to={`/medicines/${medicine.id}${locationSearch}`} className="btn btn-outline btn-sm view-med-btn">
          <span>View Availability</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

import React from 'react';
import { Store, MapPin, Phone, Clock, ShieldCheck, ShoppingBag, AlertCircle } from 'lucide-react';
import './PharmacyStockCard.css';

export default function PharmacyStockCard({
  pharmacy,
  medicine,
  onReserve,
  onViewOnMap
}) {
  const isOutOfStock = pharmacy.quantity <= 0;
  const isLowStock = pharmacy.quantity > 0 && pharmacy.quantity <= pharmacy.minStockLevel;

  return (
    <div className={`card pharmacy-stock-card ${isOutOfStock ? 'card-out-of-stock' : ''}`}>
      <div className="pharmacy-card-main">
        {/* Left: Pharmacy Info */}
        <div className="pharmacy-meta">
          <div className="pharmacy-name-row">
            <h4 className="pharmacy-name">{pharmacy.name}</h4>
            <span className="badge badge-success verified-badge" title="State Drug Control Approved License">
              <ShieldCheck size={12} />
              <span>Verified Pharmacy</span>
            </span>
          </div>

          <div className="pharmacy-details">
            <div className="detail-item">
              <MapPin size={15} className="detail-icon" />
              <span>{pharmacy.address}, {pharmacy.city}</span>
              {pharmacy.distanceKm !== undefined && (
                <span className="distance-badge">{pharmacy.distanceKm} km away</span>
              )}
            </div>

            <div className="detail-item">
              <Clock size={15} className="detail-icon" />
              <span>{pharmacy.openingHours}</span>
            </div>

            <div className="detail-item">
              <Phone size={15} className="detail-icon" />
              <span>{pharmacy.phone}</span>
            </div>
          </div>
        </div>

        {/* Right: Pricing & Stock status */}
        <div className="pharmacy-pricing-block">
          <div className="price-display">
            <span className="currency-symbol">₹</span>
            <span className="price-value">{pharmacy.price.toFixed(2)}</span>
            <span className="per-unit">/ unit</span>
          </div>

          <div className="stock-indicator-wrapper">
            {isOutOfStock ? (
              <span className="badge badge-danger">Out of Stock</span>
            ) : isLowStock ? (
              <span className="badge badge-warning">Low Stock ({pharmacy.quantity} left)</span>
            ) : (
              <span className="badge badge-success">Available ({pharmacy.quantity} in stock)</span>
            )}
          </div>

          <div className="pharmacy-actions">
            {onViewOnMap && (
              <button
                type="button"
                className="btn btn-ghost btn-sm map-locate-btn"
                onClick={() => onViewOnMap(pharmacy)}
              >
                <MapPin size={14} />
                <span>Locate on Map</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary btn-sm reserve-btn"
              disabled={isOutOfStock}
              onClick={() => onReserve(pharmacy)}
            >
              <ShoppingBag size={15} />
              <span>{isOutOfStock ? 'Unavailable' : 'Reserve for Pickup'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

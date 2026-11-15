import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import './PharmacyMap.css';

export default function PharmacyMap({
  pharmacies = [],
  userLocation = { latitude: 12.9716, longitude: 77.5946 },
  selectedPharmacyId = null,
  onSelectPharmacy,
  height = '420px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not already initialized
    if (!mapInstanceRef.current) {
      const center = [userLocation.latitude || 12.9716, userLocation.longitude || 77.5946];
      const map = L.map(mapContainerRef.current, {
        center,
        zoom: 13,
        scrollWheelZoom: false
      });

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      markersGroupRef.current = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    // Clear old markers
    markersGroup.clearLayers();

    // 1. Add User / Search Center Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div class="pulse-ring"></div><div class="user-pin">📍</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
      .bindPopup(`<strong>Your Search Location</strong><br/>Bengaluru Reference Center`);
    markersGroup.addLayer(userMarker);

    // 2. Add Pharmacy Markers
    pharmacies.forEach((p) => {
      const isSelected = selectedPharmacyId === p.id || selectedPharmacyId === p.pharmacyId;
      const isAvailable = p.quantity === undefined || p.quantity > 0;

      const markerColor = isSelected ? '#0F766E' : isAvailable ? '#0D9488' : '#94A3B8';
      const pharmacyIcon = L.divIcon({
        className: `custom-pharmacy-marker ${isSelected ? 'is-selected' : ''}`,
        html: `
          <div class="pharm-pin" style="background-color: ${markerColor};">
            <span>🏥</span>
            ${p.price ? `<div class="pin-price">₹${p.price}</div>` : ''}
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -38]
      });

      const popupHtml = `
        <div class="map-popup-card">
          <h4 class="popup-title">${p.name || p.pharmacy_name}</h4>
          <p class="popup-address">${p.address || ''}, ${p.city || ''}</p>
          <div class="popup-meta">
            ${p.price ? `<span class="popup-price">Price: ₹${p.price}</span>` : ''}
            ${p.quantity !== undefined ? `<span class="popup-stock">${p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}</span>` : ''}
          </div>
          ${p.openingHours ? `<div class="popup-hours">🕒 ${p.openingHours}</div>` : ''}
          ${onSelectPharmacy && isAvailable ? `
            <button class="popup-btn" id="btn-select-${p.id || p.pharmacyId}">
              Select for Reservation
            </button>
          ` : ''}
        </div>
      `;

      const marker = L.marker([p.latitude, p.longitude], { icon: pharmacyIcon })
        .bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${p.id || p.pharmacyId}`);
        if (btn && onSelectPharmacy) {
          btn.onclick = () => onSelectPharmacy(p);
        }
      });

      markersGroup.addLayer(marker);
    });

    // Fit map view to bounds if markers exist
    if (markersGroup.getLayers().length > 0) {
      map.fitBounds(markersGroup.getBounds().pad(0.15));
    }

    return () => {
      // Clean up map when component unmounts
    };
  }, [pharmacies, userLocation, selectedPharmacyId, onSelectPharmacy]);

  return (
    <div className="pharmacy-map-wrapper">
      <div className="map-sample-notice">
        <span>Leaflet & OpenStreetMap Live Map Interface • Verified Pharmacy Locations</span>
      </div>
      <div 
        ref={mapContainerRef} 
        className="pharmacy-map-container" 
        style={{ height }}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Pill, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Building2, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  Info,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { medicineService } from '../services/api';
import PharmacyStockCard from '../components/search/PharmacyStockCard';
import PharmacyMap from '../components/map/PharmacyMap';
import ReservationModal from '../components/reservations/ReservationModal';
import { useAuth } from '../context/AuthContext';
import './MedicineDetailPage.css';

export default function MedicineDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const locationParams = new URLSearchParams(location.search);
  const requestedLatitude = Number.parseFloat(locationParams.get('user_lat'));
  const requestedLongitude = Number.parseFloat(locationParams.get('user_lng'));
  const referenceLocation = Number.isFinite(requestedLatitude) && Number.isFinite(requestedLongitude)
    ? { latitude: requestedLatitude, longitude: requestedLongitude }
    : { latitude: 12.9716, longitude: 77.5946 };

  const [medicine, setMedicine] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [verifiedAlternatives, setVerifiedAlternatives] = useState([]);
  const [userLocation, setUserLocation] = useState(referenceLocation);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pharmacy filters
  const [pharmacyFilter, setPharmacyFilter] = useState('all'); // 'all', 'in_stock', 'nearest', 'cheapest'
  const [selectedPharmacyForModal, setSelectedPharmacyForModal] = useState(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [highlightedPharmacyId, setHighlightedPharmacyId] = useState(null);

  useEffect(() => {
    async function loadMedicine() {
      setIsLoading(false);
      setIsLoading(true);
      setError(null);

      try {
        const res = await medicineService.getById(id, {
          user_lat: referenceLocation.latitude,
          user_lng: referenceLocation.longitude
        });

        if (res.data.success) {
          setMedicine(res.data.data);
          setPharmacies(res.data.data.pharmacies || []);
          setVerifiedAlternatives(res.data.data.verifiedAlternatives || []);
          if (res.data.data.patientReferenceLocation) {
            setUserLocation(res.data.data.patientReferenceLocation);
          } else {
            setUserLocation(referenceLocation);
          }
        } else {
          setError('Medicine details not found.');
        }
      } catch (err) {
        console.error('Failed to load medicine details:', err);
        setError('Failed to retrieve medicine details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMedicine();
  }, [id, requestedLatitude, requestedLongitude]);

  useEffect(() => {
    const pendingReservation = location.state?.resumeReservation;
    if (!medicine || !pendingReservation || String(pendingReservation.medicineId) !== String(id) || !pendingReservation.pharmacy) {
      return;
    }

    setSelectedPharmacyForModal(pendingReservation.pharmacy);
    setIsReservationModalOpen(true);
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true });
  }, [id, medicine, location.hash, location.pathname, location.search, location.state, navigate]);

  // Filter and sort pharmacies
  const getFilteredPharmacies = () => {
    let list = [...pharmacies];

    if (pharmacyFilter === 'in_stock') {
      list = list.filter(p => p.quantity > 0);
    } else if (pharmacyFilter === 'nearest') {
      list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (pharmacyFilter === 'cheapest') {
      list.sort((a, b) => a.price - b.price);
    }

    return list;
  };

  const handleOpenReserveModal = (pharmacy) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: location,
          resumeReservation: { medicineId: id, pharmacy }
        }
      });
      return;
    }

    if (user?.role !== 'patient') {
      const dashboardByRole = {
        pharmacy_owner: '/pharmacy/dashboard',
        admin: '/admin/dashboard'
      };
      navigate(dashboardByRole[user?.role] || '/');
      return;
    }

    setSelectedPharmacyForModal(pharmacy);
    setIsReservationModalOpen(true);
  };

  const handleLocateOnMap = (pharmacy) => {
    setHighlightedPharmacyId(pharmacy.pharmacyId || pharmacy.id);
    const mapElement = document.getElementById('pharmacy-map-section');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="container med-detail-loading">
        <div className="skeleton" style={{ width: '100%', height: '240px', borderRadius: '16px', marginBottom: '24px' }}></div>
        <div className="skeleton" style={{ width: '100%', height: '400px', borderRadius: '16px' }}></div>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px' }}>
          <AlertTriangle size={48} className="text-danger" style={{ marginBottom: '16px' }} />
          <h2>Medicine Not Found</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '12px 0 24px 0' }}>
            {error || 'The requested medicine record could not be loaded.'}
          </p>
          <Link to="/medicines" className="btn btn-primary">
            Back to Medicine Search
          </Link>
        </div>
      </div>
    );
  }

  const filteredPharmacies = getFilteredPharmacies();
  const inStockCount = pharmacies.filter(p => p.quantity > 0).length;

  return (
    <div className="medicine-detail-page">
      {/* Breadcrumb Navigation */}
      <div className="container breadcrumb-container">
        <Link to="/medicines" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Search</span>
        </Link>
        <span className="breadcrumb-divider">/</span>
        <span className="breadcrumb-curr">{medicine.brand_name}</span>
      </div>

      <div className="container">
        {/* Main Medicine Overview Card */}
        <div className="card medicine-overview-card">
          <div className="overview-header-grid">
            <div className="overview-left">
              <div className="brand-badge-row">
                <span className="badge badge-primary">{medicine.dosage_form}</span>
                {medicine.prescription_required ? (
                  <span className="badge badge-warning">
                    <FileText size={12} />
                    <span>Prescription Required</span>
                  </span>
                ) : (
                  <span className="badge badge-success">Over-the-counter (OTC)</span>
                )}
                {medicine.category_name && (
                  <span className="badge badge-neutral">{medicine.category_name}</span>
                )}
              </div>

              <h1 className="medicine-main-title">{medicine.brand_name}</h1>
              <p className="medicine-scientific-title">
                {medicine.generic_name} • <strong>{medicine.strength}</strong>
              </p>

              <div className="medicine-quick-props">
                <div className="prop-item">
                  <span className="prop-label">Active Ingredient:</span>
                  <span className="prop-value font-bold">{medicine.active_ingredient}</span>
                </div>
                <div className="prop-item">
                  <span className="prop-label">Manufacturer:</span>
                  <span className="prop-value">{medicine.manufacturer}</span>
                </div>
              </div>
            </div>

            {/* Price & Availability Summary Banner */}
            <div className="overview-right-summary">
              <div className="availability-summary-box">
                <div className="stock-count-label">
                  {inStockCount > 0 ? (
                    <span className="stock-positive">
                      <CheckCircle2 size={16} />
                      <span>In Stock at {inStockCount} {inStockCount === 1 ? 'Pharmacy' : 'Pharmacies'}</span>
                    </span>
                  ) : (
                    <span className="stock-negative">
                      <AlertTriangle size={16} />
                      <span>Out of Stock Nearby</span>
                    </span>
                  )}
                </div>

                <div className="price-overview-amount">
                  <span className="price-from">Prices starting from</span>
                  <div className="price-value-large">
                    ₹{medicine.pharmacies.length > 0 ? Math.min(...medicine.pharmacies.map(p => p.price)).toFixed(2) : 'N/A'}
                  </div>
                </div>

                <a href="#available-pharmacies" className="btn btn-primary btn-sm jump-reserve-btn">
                  <span>View Stock & Reserve</span>
                  <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Description & Usage Guide */}
          <div className="medicine-clinical-info">
            <div className="info-block">
              <h4 className="info-heading">Therapeutic Use & Description</h4>
              <p>{medicine.description || 'No detailed description available.'}</p>
            </div>

            {medicine.usage_instructions && (
              <div className="info-block">
                <h4 className="info-heading">Standard Administration Guidelines</h4>
                <p>{medicine.usage_instructions}</p>
              </div>
            )}

            {medicine.side_effects && (
              <div className="info-block">
                <h4 className="info-heading text-warning">Potential Side Effects & Precautions</h4>
                <p>{medicine.side_effects}</p>
              </div>
            )}
          </div>

          {/* Mandatory Medical Disclaimer Box */}
          <div className="medical-disclaimer-box">
            <ShieldCheck size={20} className="disclaimer-alert-icon" />
            <div className="disclaimer-text">
              <strong>Qualified Healthcare Professional Advice Required:</strong>
              <p>
                The drug information provided on MediFind is intended for educational and inventory discovery purposes only. Always consult a licensed medical practitioner for diagnosis, dosing, and medical decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Verified Bio-Equivalent Alternatives */}
        {verifiedAlternatives.length > 0 && (
          <div className="card alternatives-section-card">
            <div className="alt-section-header">
              <div className="alt-title-wrapper">
                <Sparkles size={20} className="text-primary" />
                <h3 className="alt-heading">Verified Bio-Equivalent Alternatives</h3>
              </div>
              <span className="alt-badge">Same Active Ingredient ({medicine.active_ingredient} {medicine.strength})</span>
            </div>

            <p className="alt-intro-note">
              The following alternative brands contain the identical active pharmaceutical ingredient, dosage form, and strength. Always consult your prescribing doctor or dispensing pharmacist before substituting brands.
            </p>

            <div className="alternatives-grid">
              {verifiedAlternatives.map((alt) => (
                <div key={alt.id} className="alt-medicine-card">
                  <div className="alt-med-info">
                    <h4 className="alt-brand-name">{alt.brand_name}</h4>
                    <p className="alt-manufacturer">{alt.manufacturer}</p>
                    <span className="alt-strength-tag">{alt.strength} • {alt.dosage_form}</span>
                  </div>

                  <div className="alt-med-footer">
                    <div className="alt-price">
                      <span className="alt-price-label">Price from:</span>
                      <strong>₹{alt.min_price ? alt.min_price.toFixed(2) : 'N/A'}</strong>
                    </div>

                    <Link to={`/medicines/${alt.id}`} className="btn btn-outline btn-sm">
                      <span>Check Stock</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Available Pharmacies & Leaflet Interactive Map */}
        <div className="pharmacies-section" id="available-pharmacies">
          <div className="section-title-row">
            <div>
              <h2 className="section-heading">Available Nearby Pharmacies</h2>
              <p className="section-subheading">
                Compare prices, check distance, and reserve your medication for quick in-store pickup.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="pharmacy-filters-row">
              <button
                className={`filter-chip ${pharmacyFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPharmacyFilter('all')}
              >
                All Pharmacies ({pharmacies.length})
              </button>
              <button
                className={`filter-chip ${pharmacyFilter === 'in_stock' ? 'active' : ''}`}
                onClick={() => setPharmacyFilter('in_stock')}
              >
                In Stock Only ({inStockCount})
              </button>
              <button
                className={`filter-chip ${pharmacyFilter === 'nearest' ? 'active' : ''}`}
                onClick={() => setPharmacyFilter('nearest')}
              >
                Nearest First
              </button>
              <button
                className={`filter-chip ${pharmacyFilter === 'cheapest' ? 'active' : ''}`}
                onClick={() => setPharmacyFilter('cheapest')}
              >
                Lowest Price
              </button>
            </div>
          </div>

          <div className="pharmacies-layout-grid">
            {/* Left: Pharmacy Stock Cards List */}
            <div className="pharmacies-cards-list">
              {filteredPharmacies.length === 0 ? (
                <div className="card text-center" style={{ padding: '40px 20px' }}>
                  <AlertTriangle size={36} className="text-warning" style={{ margin: '0 auto 12px auto' }} />
                  <h4>No Registered Pharmacies Nearby</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                    No approved MediFind pharmacies were found within {medicine.nearbyPharmacyRadiusKm || 25} km. Coverage depends on registered pharmacies in your area.
                  </p>
                </div>
              ) : (
                filteredPharmacies.map((pharm) => (
                  <PharmacyStockCard
                    key={pharm.inventoryId || pharm.pharmacyId}
                    pharmacy={pharm}
                    medicine={medicine}
                    onReserve={() => handleOpenReserveModal(pharm)}
                    onViewOnMap={() => handleLocateOnMap(pharm)}
                  />
                ))
              )}
            </div>

            {/* Right: Interactive OpenStreetMap with Leaflet */}
            <div className="pharmacies-map-side" id="pharmacy-map-section">
              <div className="sticky-map-wrapper">
                <PharmacyMap
                  pharmacies={filteredPharmacies}
                  userLocation={userLocation}
                  selectedPharmacyId={highlightedPharmacyId}
                  onSelectPharmacy={(pharm) => handleOpenReserveModal(pharm)}
                  height="480px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Reservation Modal */}
      {selectedPharmacyForModal && (
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={() => setIsReservationModalOpen(false)}
          medicine={medicine}
          pharmacy={selectedPharmacyForModal}
          onSuccess={(res) => {
            // Update local stock count smoothly
            setPharmacies(prev =>
              prev.map(p => {
                if (p.pharmacyId === selectedPharmacyForModal.pharmacyId) {
                  return { ...p, quantity: Math.max(0, p.quantity - res.quantity) };
                }
                return p;
              })
            );
          }}
        />
      )}
    </div>
  );
}

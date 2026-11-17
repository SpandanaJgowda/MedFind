import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Search, 
  CalendarCheck, 
  Store, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  MapPin,
  Pill,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reservationService, pharmacyService, medicineService } from '../../services/api';
import SearchBar from '../../components/search/SearchBar';
import './PatientDashboard.css';

function getSavedLocation() {
  try {
    return JSON.parse(localStorage.getItem('medifind_location') || 'null');
  } catch (error) {
    return null;
  }
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [nearbyPharmacies, setNearbyPharmacies] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientLocation, setPatientLocation] = useState(getSavedLocation);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [resRes, searchRes] = await Promise.all([
          reservationService.getPatientReservations({ status: 'all' }),
          medicineService.getRecentSearches()
        ]);

        if (resRes.data.success) setReservations(resRes.data.data || []);
        if (searchRes.data.success) setRecentSearches(searchRes.data.data || []);
      } catch (err) {
        console.error('Patient dashboard loading error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;
    const hasLocation = Number.isFinite(patientLocation?.latitude) && Number.isFinite(patientLocation?.longitude);

    if (!hasLocation) {
      setNearbyPharmacies([]);
      setNearbyError('');
      setIsLoadingNearby(false);
      return () => { isCurrentRequest = false; };
    }

    async function loadNearbyPharmacies() {
      setIsLoadingNearby(true);
      setNearbyError('');
      try {
        const response = await pharmacyService.getNearby({
          user_lat: patientLocation.latitude,
          user_lng: patientLocation.longitude,
          radius_km: 25,
          limit: 4
        });
        if (isCurrentRequest && response.data.success) {
          setNearbyPharmacies(response.data.data || []);
        }
      } catch (error) {
        if (isCurrentRequest) {
          setNearbyPharmacies([]);
          setNearbyError(error.response?.data?.message || 'Could not load nearby pharmacies.');
        }
      } finally {
        if (isCurrentRequest) setIsLoadingNearby(false);
      }
    }

    loadNearbyPharmacies();
    return () => { isCurrentRequest = false; };
  }, [patientLocation?.latitude, patientLocation?.longitude]);

  const handleLocationChange = ({ q, city, user_lat, user_lng }) => {
    const nextLocation = { label: city, latitude: user_lat, longitude: user_lng };
    localStorage.setItem('medifind_location', JSON.stringify(nextLocation));
    setPatientLocation(nextLocation);
    setNearbyPharmacies([]);
    if (q) {
      const params = new URLSearchParams({ q, city, user_lat: String(user_lat), user_lng: String(user_lng) });
      navigate(`/medicines?${params}`);
    }
  };

  const activeReservations = reservations.filter(
    r => ['Pending', 'Confirmed', 'Ready for Pickup'].includes(r.status)
  );
  const completedReservations = reservations.filter(r => r.status === 'Completed');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ready for Pickup':
        return <span className="badge badge-success">Ready for Pickup</span>;
      case 'Confirmed':
        return <span className="badge badge-primary">Confirmed</span>;
      case 'Pending':
        return <span className="badge badge-warning">Pending Review</span>;
      case 'Completed':
        return <span className="badge badge-neutral">Completed</span>;
      case 'Cancelled':
      case 'Rejected':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="patient-dashboard-page">
      {/* Top Banner */}
      <section className="dashboard-welcome-banner">
        <div className="container">
          <div className="welcome-banner-content">
            <div className="welcome-avatar">
              <User size={32} />
            </div>
            <div>
              <div className="welcome-tag">PATIENT PORTAL</div>
              <h1 className="welcome-name">Welcome back, {user?.name}!</h1>
              <p className="welcome-sub">
                {patientLocation?.label
                  ? `Find available medicines near ${patientLocation.label}, compare prices, and manage your pickup reservations.`
                  : 'Choose your location to find nearby pharmacies, compare prices, and manage your pickup reservations.'}
              </p>
            </div>
          </div>

          <div className="dashboard-search-container">
            <SearchBar
              initialCity={patientLocation?.label || ''}
              initialCoordinates={patientLocation}
              onSearch={handleLocationChange}
              placeholder="Search by brand name, generic formulation, or active ingredient..."
            />
          </div>
        </div>
      </section>

      <div className="container dashboard-main-content">
        {/* Metric Cards Row */}
        <div className="patient-metrics-row">
          <div className="metric-card">
            <div className="metric-icon-box bg-primary-light text-primary">
              <CalendarCheck size={24} />
            </div>
            <div className="metric-details">
              <span className="metric-number">{activeReservations.length}</span>
              <span className="metric-title">Active Reservations</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box bg-success-light text-success">
              <CheckCircle2 size={24} />
            </div>
            <div className="metric-details">
              <span className="metric-number">{completedReservations.length}</span>
              <span className="metric-title">Completed Pickups</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box bg-secondary-light text-secondary">
              <Store size={24} />
            </div>
            <div className="metric-details">
              <span className="metric-number">{nearbyPharmacies.length}</span>
              <span className="metric-title">Nearby Verified Pharmacies</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box bg-warning-light text-warning">
              <Sparkles size={24} />
            </div>
            <div className="metric-details">
              <span className="metric-number">{recentSearches.length}</span>
              <span className="metric-title">Recent Searches Saved</span>
            </div>
          </div>
        </div>

        {/* Dashboard 2-Column Content */}
        <div className="dashboard-sections-grid">
          {/* Left Column: Recent & Active Reservations */}
          <div className="dashboard-left-col">
            <div className="card dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3 className="card-heading">Active & Recent Reservations</h3>
                  <p className="card-subheading">Track the status of your medicine pickups</p>
                </div>
                <Link to="/patient/reservations" className="btn btn-outline btn-sm">
                  View All ({reservations.length})
                </Link>
              </div>

              {reservations.length === 0 ? (
                <div className="empty-reservations-box">
                  <CalendarCheck size={40} className="text-light" />
                  <h4>No Reservations Yet</h4>
                  <p>When you reserve medicine at a nearby pharmacy, it will appear here.</p>
                  <Link to="/medicines" className="btn btn-primary btn-sm">
                    Find Medicines to Reserve
                  </Link>
                </div>
              ) : (
                <div className="dashboard-reservations-list">
                  {reservations.slice(0, 4).map((r) => (
                    <div key={r.id} className="dash-reservation-item">
                      <div className="dash-res-main">
                        <div className="dash-res-title-row">
                          <h4 className="dash-res-med-name">{r.brand_name || r.medicine_name}</h4>
                          {getStatusBadge(r.status)}
                        </div>

                        <div className="dash-res-details">
                          <span className="dash-res-code">Code: <strong>{r.reservation_code}</strong></span>
                          <span>•</span>
                          <span>{r.quantity} unit{r.quantity > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span className="dash-res-price">Total: ₹{r.total_price}</span>
                        </div>

                        <div className="dash-res-pharmacy">
                          <Store size={14} className="text-primary" />
                          <span>{r.pharmacy_name} ({r.pharmacy_address})</span>
                        </div>
                      </div>

                      <div className="dash-res-action">
                        {r.status === 'Ready for Pickup' && (
                          <div className="ready-alert-pill">
                            <CheckCircle2 size={12} />
                            <span>Ready at counter!</span>
                          </div>
                        )}
                        <Link to="/patient/reservations" className="btn btn-ghost btn-sm">
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Nearby Pharmacies & Quick Actions */}
          <div className="dashboard-right-col">
            {/* Nearby Pharmacies Card */}
            <div className="card dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3 className="card-heading">Nearby Pharmacies</h3>
                  <p className="card-subheading">
                    {patientLocation?.label ? `Approved stores within 25 km of ${patientLocation.label}` : 'Choose a location to see nearby approved stores'}
                  </p>
                </div>
              </div>

              <div className="dash-pharmacies-list">
                {isLoadingNearby ? (
                  <p className="card-subheading">Finding pharmacies near your location...</p>
                ) : nearbyError ? (
                  <p className="card-subheading">{nearbyError}</p>
                ) : !patientLocation ? (
                  <p className="card-subheading">Use the location pin for live location or enter a city above.</p>
                ) : nearbyPharmacies.length === 0 ? (
                  <p className="card-subheading">No approved pharmacies were found within 25 km of {patientLocation.label}. Try another location or check back as local stores join MediFind.</p>
                ) : nearbyPharmacies.slice(0, 3).map((pharm) => (
                  <div key={pharm.id} className="dash-pharmacy-item">
                    <div className="dash-pharm-info">
                      <h4 className="dash-pharm-name">{pharm.name}</h4>
                      <div className="dash-pharm-addr">
                        <MapPin size={13} />
                        <span>{pharm.address}</span>
                      </div>
                      <div className="dash-pharm-hours">
                        <Clock size={13} />
                        <span>{pharm.openingHours}</span>
                      </div>
                    </div>
                    <div className="dash-pharm-dist">
                      {pharm.distanceKm !== undefined && (
                        <span className="distance-tag">{pharm.distanceKm} km</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="card dashboard-card">
              <h3 className="card-heading">Quick Actions</h3>
              <div className="quick-actions-list">
                <Link to="/medicines" className="quick-action-link">
                  <div className="qa-icon bg-primary-light text-primary">
                    <Search size={18} />
                  </div>
                  <div>
                    <div className="qa-title">Search Medicines</div>
                    <div className="qa-sub">Browse catalog and check stock</div>
                  </div>
                </Link>

                <Link to="/patient/reservations" className="quick-action-link">
                  <div className="qa-icon bg-secondary-light text-secondary">
                    <CalendarCheck size={18} />
                  </div>
                  <div>
                    <div className="qa-title">My Reservations</div>
                    <div className="qa-sub">View pickup codes & history</div>
                  </div>
                </Link>

                <Link to="/patient/profile" className="quick-action-link">
                  <div className="qa-icon bg-warning-light text-warning">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="qa-title">Account Settings</div>
                    <div className="qa-sub">Update profile & password</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

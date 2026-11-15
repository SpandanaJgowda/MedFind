import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarCheck, 
  Store, 
  MapPin, 
  Phone, 
  Clock, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { reservationService } from '../../services/api';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import './PatientDashboard.css';

export default function PatientReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'Completed', 'Cancelled'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelModalReservation, setCancelModalReservation] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reservationService.getPatientReservations({ status: filterStatus });
      if (res.data.success) {
        setReservations(res.data.data || []);
      }
    } catch (err) {
      setError('Failed to load reservations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filterStatus]);

  const handleCancelReservation = async (e) => {
    e.preventDefault();
    if (!cancelModalReservation) return;

    setIsCancelling(true);
    try {
      const res = await reservationService.cancelReservation(cancelModalReservation.id, cancelReason);
      if (res.data.success) {
        setSuccessMessage('Reservation cancelled successfully.');
        setCancelModalReservation(null);
        setCancelReason('');
        fetchReservations();
      } else {
        setError(res.data.message || 'Failed to cancel reservation.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error cancelling reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

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
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
          My Medicine Reservations
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '4px' }}>
          Track reserved medicines, view unique pickup codes, and check pharmacy collection instructions.
        </p>
      </div>

      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Reservations' },
          { id: 'active', label: 'Active (Pending / Ready)' },
          { id: 'Completed', label: 'Completed Pickups' },
          { id: 'Cancelled', label: 'Cancelled / Rejected' }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`btn btn-sm ${filterStatus === tab.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterStatus(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading your reservations...
        </div>
      ) : reservations.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <CalendarCheck size={48} className="text-light" style={{ margin: '0 auto 16px auto' }} />
          <h3>No Reservations in This Filter</h3>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '8px auto 20px auto' }}>
            Looking to reserve medicine? Search our real-time pharmacy network.
          </p>
          <Link to="/medicines" className="btn btn-primary" style={{ alignSelf: 'center' }}>
            Find Medicines Now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {reservations.map((res) => {
            const canCancel = ['Pending', 'Confirmed'].includes(res.status);

            return (
              <div key={res.id} className="card" style={{ padding: '24px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary-dark)', background: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: '4px' }}>
                        {res.reservation_code}
                      </span>
                      {getStatusBadge(res.status)}
                      {res.prescription_required ? (
                        <span className="badge badge-warning">
                          <FileText size={12} />
                          <span>Prescription Mandatory</span>
                        </span>
                      ) : null}
                    </div>

                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      {res.brand_name || res.medicine_name} ({res.strength})
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
                      {res.generic_name} • {res.dosage_form}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
                      Total Amount (Pay at Counter)
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      ₹{res.total_price}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {res.quantity} unit{res.quantity > 1 ? 's' : ''} × ₹{res.unit_price}
                    </div>
                  </div>
                </div>

                {/* Pharmacy Info & Pickup Deadline */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
                      <Store size={16} className="text-primary" />
                      <span>{res.pharmacy_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <MapPin size={14} />
                      <span>{res.pharmacy_address}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <Phone size={14} />
                      <span>{res.pharmacy_phone}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <Clock size={14} />
                      <span>Reserved on: {new Date(res.reserved_at).toLocaleString()}</span>
                    </div>
                    {res.pickup_deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#92400E', fontWeight: 600 }}>
                        <Clock size={14} />
                        <span>Pickup Deadline: {new Date(res.pickup_deadline).toLocaleString()}</span>
                      </div>
                    )}
                    {res.patient_notes && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                        Notes: "{res.patient_notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Ready Alert Notice */}
                {res.status === 'Ready for Pickup' && (
                  <div style={{ background: 'var(--color-accent-subtle)', border: '1px solid var(--color-accent-light)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#065F46', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={20} />
                    <span>
                      <strong>Good news!</strong> The pharmacy has prepared your medicine. Show reservation code <strong>{res.reservation_code}</strong> at the counter to collect.
                    </span>
                  </div>
                )}

                {/* Footer action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                  {canCancel && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setCancelModalReservation(res)}
                    >
                      Cancel Reservation
                    </button>
                  )}
                  <Link to={`/medicines/${res.medicine_id}`} className="btn btn-outline btn-sm">
                    View Medicine Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalReservation && (
        <Modal
          isOpen={!!cancelModalReservation}
          onClose={() => setCancelModalReservation(null)}
          title="Cancel Medicine Reservation"
        >
          <form onSubmit={handleCancelReservation}>
            <p style={{ marginBottom: '16px', fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
              Are you sure you want to cancel reservation <strong>{cancelModalReservation.reservation_code}</strong> for <strong>{cancelModalReservation.brand_name}</strong> at {cancelModalReservation.pharmacy_name}?
            </p>

            <div className="form-group">
              <label className="form-label">Reason for Cancellation (Optional)</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="e.g. Found alternative medicine, doctor changed prescription..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setCancelModalReservation(null)}
              >
                Keep Reservation
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

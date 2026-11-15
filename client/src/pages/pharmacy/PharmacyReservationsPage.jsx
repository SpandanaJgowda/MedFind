import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  User, 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PackageCheck, 
  Filter, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { reservationService } from '../../services/api';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import './PharmacyDashboard.css';

export default function PharmacyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Reject Modal state
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const res = await reservationService.getPharmacyReservations({ status: statusFilter });
      if (res.data.success) {
        setReservations(res.data.data || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to load pharmacy reservations.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status, notes = null) => {
    try {
      const res = await reservationService.updateStatus(id, { status, pharmacyNotes: notes });
      if (res.data.success) {
        setAlert({ type: 'success', message: `Reservation status updated to '${status}'.` });
        fetchReservations();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to update reservation.' });
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectItem) return;

    await handleUpdateStatus(rejectItem.id, 'Rejected', rejectReason || 'Pharmacy out of requested formulation');
    setRejectItem(null);
    setRejectReason('');
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
          Patient Pickup Reservations
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '4px' }}>
          Process incoming customer medicine reservations, package orders, and confirm dispensing.
        </p>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Requests' },
          { id: 'Pending', label: 'Pending Review' },
          { id: 'Confirmed', label: 'Accepted & Packing' },
          { id: 'Ready for Pickup', label: 'Ready at Counter' },
          { id: 'Completed', label: 'Dispensed' },
          { id: 'Rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-sm ${statusFilter === tab.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading customer reservations...
        </div>
      ) : reservations.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <CalendarCheck size={48} className="text-light" style={{ margin: '0 auto 16px auto' }} />
          <h3>No Reservations in this Filter</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
            New patient reservations will appear here as soon as orders are placed.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reservations.map((r) => (
            <div key={r.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className="code-text" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                      {r.reservation_code}
                    </span>
                    <span className={`badge badge-${r.status === 'Ready for Pickup' ? 'success' : r.status === 'Confirmed' ? 'primary' : r.status === 'Pending' ? 'warning' : 'neutral'}`}>
                      {r.status}
                    </span>
                    {r.prescription_required ? (
                      <span className="badge badge-warning">
                        <FileText size={12} />
                        <span>Prescription Required</span>
                      </span>
                    ) : null}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {r.brand_name || r.medicine_name} ({r.strength})
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {r.dosage_form}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
                    Payment on Collection
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                    ₹{r.total_price}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                    {r.quantity} unit{r.quantity > 1 ? 's' : ''} requested (Current stock: {r.current_inventory_stock ?? 'N/A'})
                  </div>
                </div>
              </div>

              {/* Patient and Notes Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.92rem' }}>
                    <User size={16} className="text-primary" />
                    <span>Patient: {r.patient_name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <Phone size={14} />
                    <span>Phone: {r.patient_phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <Clock size={14} />
                    <span>Reserved: {new Date(r.reserved_at).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  {r.patient_notes && (
                    <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <strong>Patient Note:</strong> "{r.patient_notes}"
                    </div>
                  )}
                  {r.pharmacy_notes && (
                    <div style={{ background: '#F0FDFA', padding: '10px 14px', borderRadius: '6px', border: '1px solid #CCFBF1', fontSize: '0.85rem', color: 'var(--color-primary-dark)', marginTop: '6px' }}>
                      <strong>Pharmacy Note:</strong> "{r.pharmacy_notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                {r.status === 'Pending' && (
                  <>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setRejectItem(r)}
                    >
                      Reject
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleUpdateStatus(r.id, 'Confirmed')}
                    >
                      Accept & Hold Stock
                    </button>
                  </>
                )}

                {r.status === 'Confirmed' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateStatus(r.id, 'Ready for Pickup')}
                  >
                    Mark Ready for Pickup
                  </button>
                )}

                {r.status === 'Ready for Pickup' && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                    onClick={() => handleUpdateStatus(r.id, 'Completed')}
                  >
                    <PackageCheck size={16} />
                    <span>Dispense & Complete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reservation Modal */}
      {rejectItem && (
        <Modal
          isOpen={!!rejectItem}
          onClose={() => setRejectItem(null)}
          title="Decline Patient Reservation"
        >
          <form onSubmit={handleConfirmReject}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Are you sure you want to decline reservation <strong>{rejectItem.reservation_code}</strong> for {rejectItem.brand_name}?
            </p>

            <div className="form-group">
              <label className="form-label">Reason for Rejection</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="e.g. Stock reserved for prior prescription, expired batch..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRejectItem(null)}
              >
                Back
              </button>
              <button type="submit" className="btn btn-danger">
                Decline Order
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

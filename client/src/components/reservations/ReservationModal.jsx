import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Store, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import { prescriptionService, reservationService } from '../../services/api';
import './ReservationModal.css';

export default function ReservationModal({
  isOpen,
  onClose,
  medicine,
  pharmacy
}) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reservationConfirmed, setReservationConfirmed] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [isUploadingPrescription, setIsUploadingPrescription] = useState(false);
  const [prescriptionMessage, setPrescriptionMessage] = useState('');

  const pharmacyId = pharmacy?.pharmacyId || pharmacy?.id;

  useEffect(() => {
    if (!isOpen || !medicine?.prescription_required || !pharmacyId) return;
    let active = true;
    setPrescriptions([]);
    setPrescriptionId(null);
    setPrescriptionMessage('');
    prescriptionService.getPatientPrescriptions({ medicineId: medicine.id, pharmacyId })
      .then(response => {
        if (!active) return;
        const items = response.data.data || [];
        setPrescriptions(items);
        setPrescriptionId(items.find(item => item.status === 'Verified')?.id || null);
      })
      .catch(() => {
        if (active) setPrescriptionMessage('Could not load prescription verification status.');
      });
    return () => { active = false; };
  }, [isOpen, medicine?.id, medicine?.prescription_required, pharmacyId]);

  if (!medicine || !pharmacy) return null;

  const unitPrice = parseFloat(pharmacy.price || 0);
  const availableStock = parseInt(pharmacy.quantity || 0, 10);
  const totalPrice = (unitPrice * quantity).toFixed(2);

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= availableStock) {
      setQuantity(newQty);
    }
  };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (medicine.prescription_required && !prescriptionId) {
      setError('Upload a prescription and wait for pharmacy verification before booking.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        pharmacyId: pharmacy.pharmacyId || pharmacy.id,
        medicineId: medicine.id,
        quantity,
        notes: notes.trim(),
        prescriptionId
      };

      const res = await reservationService.create(payload);
      if (res.data.success) {
        setReservationConfirmed(res.data.reservation);
      } else {
        setError(res.data.message || 'Failed to place reservation.');
      }
    } catch (err) {
      console.error('Reservation error:', err);
      const msg = err.response?.data?.message || 'Server error creating reservation. Please ensure you are logged in as a patient.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrescriptionUpload = async (event) => {
    event.preventDefault();
    if (!prescriptionFile) {
      setPrescriptionMessage('Select a prescription image or PDF first.');
      return;
    }

    const formData = new FormData();
    formData.append('prescription', prescriptionFile);
    formData.append('pharmacyId', pharmacyId);
    formData.append('medicineId', medicine.id);
    setIsUploadingPrescription(true);
    setPrescriptionMessage('');
    try {
      await prescriptionService.upload(formData);
      const response = await prescriptionService.getPatientPrescriptions({ medicineId: medicine.id, pharmacyId });
      setPrescriptions(response.data.data || []);
      setPrescriptionId(response.data.data?.find(item => item.status === 'Verified')?.id || null);
      setPrescriptionFile(null);
      setPrescriptionMessage('Prescription uploaded. Booking will unlock after the pharmacy verifies it.');
    } catch (uploadError) {
      setPrescriptionMessage(uploadError.response?.data?.message || 'Prescription upload failed.');
    } finally {
      setIsUploadingPrescription(false);
    }
  };

  const handleModalClose = () => {
    setReservationConfirmed(null);
    setQuantity(1);
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={reservationConfirmed ? 'Reservation Confirmed!' : 'Reserve Medicine for Pickup'}
      maxWidth="580px"
    >
      {reservationConfirmed ? (
        // Confirmation View
        <div className="reservation-success-view">
          <div className="success-icon-badge">
            <CheckCircle2 size={42} className="text-success" />
          </div>

          <h3 className="success-heading">Booking Request Sent</h3>
          <p className="success-sub">
            The pharmacy has been notified to review your request. Your stock hold and pickup deadline will appear after the pharmacy approves it.
          </p>

          <div className="reservation-code-card">
            <div className="code-label">YOUR UNIQUE RESERVATION CODE</div>
            <div className="code-value">{reservationConfirmed.reservationCode}</div>
            <div className="code-hint">Present this code at the pharmacy counter</div>
          </div>

          <div className="order-summary-box">
            <div className="summary-row">
              <span className="summary-label">Medicine:</span>
              <span className="summary-val font-bold">
                {medicine.brand_name || medicine.name} ({medicine.strength})
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Quantity:</span>
              <span className="summary-val">{reservationConfirmed.quantity} units</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Estimated Total:</span>
              <span className="summary-val total-highlight">₹{reservationConfirmed.totalPrice}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Pickup Pharmacy:</span>
              <span className="summary-val">{reservationConfirmed.pharmacy.name}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Pharmacy Address:</span>
              <span className="summary-val text-muted">{reservationConfirmed.pharmacy.address}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Contact:</span>
              <span className="summary-val">{reservationConfirmed.pharmacy.phone}</span>
            </div>
          </div>

          {/* Collection Instructions */}
          <div className="collection-guidelines">
            <h4 className="guidelines-title">
              <Info size={16} />
              <span>Important Collection Guidelines</span>
            </h4>
            <ul>
              <li>{reservationConfirmed.pickupDeadline ? `Collect by ${new Date(reservationConfirmed.pickupDeadline).toLocaleString()}.` : 'The pharmacy must approve this booking and will then provide your collection deadline.'}</li>
              <li>Pay directly at the pharmacy counter upon physical collection.</li>
              {medicine.prescription_required && (
                <li className="rx-alert">
                  <strong>Mandatory:</strong> Please present a valid doctor's prescription for {medicine.brand_name}.
                </li>
              )}
            </ul>
          </div>

          <div className="modal-actions-confirm">
            <button
              className="btn btn-outline"
              onClick={() => {
                handleModalClose();
                navigate('/patient/reservations');
              }}
            >
              View My Reservations
            </button>
            <button className="btn btn-primary" onClick={handleModalClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        // Reservation Form
        <form onSubmit={handleConfirmReservation} className="reservation-form">
          {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

          {/* Selected Medicine Info */}
          <div className="res-card-section">
            <div className="res-medicine-header">
              <div className="res-med-icon">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h4 className="res-med-title">{medicine.brand_name}</h4>
                <p className="res-med-generic">
                  {medicine.generic_name} • {medicine.strength} • {medicine.dosage_form}
                </p>
              </div>
            </div>

            {medicine.prescription_required ? (
              <div className="res-rx-badge">
                <FileText size={14} />
                <span>Pharmacy verification is required before this medicine can be booked.</span>
              </div>
            ) : null}
          </div>

          {medicine.prescription_required && (
            <section className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '8px' }}>Prescription verification</h4>
              {prescriptionId ? (
                <p style={{ color: 'var(--color-success)' }}>A prescription for this medicine has been verified by this pharmacy.</p>
              ) : (
                <>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '10px' }}>
                    Upload a clear image or PDF. The pharmacy will review it before booking is enabled.
                  </p>
                  <div>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(event) => setPrescriptionFile(event.target.files?.[0] || null)}
                    />
                    <button type="button" className="btn btn-outline btn-sm" onClick={handlePrescriptionUpload} disabled={isUploadingPrescription || !prescriptionFile} style={{ marginTop: '10px' }}>
                      {isUploadingPrescription ? 'Uploading...' : 'Upload prescription'}
                    </button>
                  </div>
                  {prescriptions.map(item => (
                    <p key={item.id} style={{ fontSize: '0.84rem', marginTop: '8px' }}>
                      {item.original_filename}: <strong>{item.status}</strong>{item.review_notes ? ` · ${item.review_notes}` : ''}
                    </p>
                  ))}
                </>
              )}
              {prescriptionMessage && <p role="status" style={{ fontSize: '0.84rem', marginTop: '8px' }}>{prescriptionMessage}</p>}
            </section>
          )}

          {/* Selected Pharmacy Info */}
          <div className="res-pharmacy-section">
            <div className="pharmacy-header-mini">
              <Store size={18} className="text-primary" />
              <strong>{pharmacy.name}</strong>
            </div>
            <p className="pharmacy-addr-mini">
              <MapPin size={14} />
              <span>{pharmacy.address}, {pharmacy.city}</span>
            </p>
            <p className="pharmacy-hours-mini">
              <Clock size={14} />
              <span>{pharmacy.openingHours || '08:00 AM - 10:00 PM'}</span>
            </p>
          </div>

          {/* Quantity Selector & Price Calculation */}
          <div className="res-quantity-block">
            <label className="res-qty-label">Quantity to Reserve:</label>
            <div className="qty-controls-row">
              <div className="qty-stepper">
                <button
                  type="button"
                  className="btn-step"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="qty-number">{quantity}</span>
                <button
                  type="button"
                  className="btn-step"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= availableStock}
                >
                  +
                </button>
              </div>
              <span className="qty-stock-hint">
                (Max available: {availableStock} units)
              </span>
            </div>
          </div>

          {/* Total Price Summary */}
          <div className="res-price-breakdown">
            <div className="price-calc-row">
              <span>Unit Price:</span>
              <span>₹{unitPrice.toFixed(2)}</span>
            </div>
            <div className="price-calc-row">
              <span>Quantity:</span>
              <span>× {quantity}</span>
            </div>
            <div className="price-calc-row total-row">
              <span>Estimated Pickup Price:</span>
              <span className="total-highlight">₹{totalPrice}</span>
            </div>
            <p className="payment-note">
              * Payment is made directly at the pharmacy counter upon physical collection. No online payment required.
            </p>
          </div>

          {/* Optional Patient Notes */}
          <div className="form-group">
            <label className="form-label">Special Instructions or Notes (Optional)</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="e.g. Arriving around 6 PM, please hold with prescription..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Submit buttons */}
          <div className="modal-actions-form">
            <button type="button" className="btn btn-ghost" onClick={handleModalClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-confirm"
              disabled={isLoading || availableStock <= 0 || (medicine.prescription_required && !prescriptionId)}
            >
              <span>{isLoading ? 'Sending booking...' : 'Request Booking'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, PackageSearch, Send } from 'lucide-react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import { procurementService } from '../../services/api';

export default function ProcurementRequestModal({ isOpen, onClose, medicine, pharmacies }) {
  const [pharmacyId, setPharmacyId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);

  const closeModal = () => {
    setPharmacyId('');
    setQuantity(1);
    setNotes('');
    setError('');
    setRequest(null);
    onClose();
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await procurementService.create({
        pharmacyId: Number(pharmacyId),
        medicineId: medicine.id,
        quantity: Number(quantity),
        notes: notes.trim()
      });
      setRequest(response.data.request);
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Could not submit procurement request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="Request Medicine Procurement" maxWidth="560px">
      {request ? (
        <div className="text-center" style={{ padding: '20px 8px' }}>
          <CheckCircle2 size={42} className="text-success" style={{ marginBottom: '12px' }} />
          <h3>Request sent to the pharmacy</h3>
          <p style={{ color: 'var(--color-text-muted)', margin: '10px 0 18px' }}>
            Request code: <strong>{request.requestCode}</strong>. You can track pharmacy updates in My Reservations.
          </p>
          <button type="button" className="btn btn-primary" onClick={closeModal}>Done</button>
        </div>
      ) : (
        <form onSubmit={submitRequest}>
          {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Ask a nearby approved pharmacy to procure {medicine.brand_name} ({medicine.strength}). The pharmacy will confirm availability, expected price, and arrival timing.
          </p>
          <div className="form-group">
            <label className="form-label" htmlFor="procurement-pharmacy">Nearby pharmacy</label>
            <select id="procurement-pharmacy" className="form-input" value={pharmacyId} onChange={(event) => setPharmacyId(event.target.value)} required>
              <option value="">Select a pharmacy</option>
              {pharmacies.map(pharmacy => (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name} · {pharmacy.city} · {pharmacy.distanceKm} km
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="procurement-quantity">Quantity</label>
            <input id="procurement-quantity" className="form-input" type="number" min="1" max="1000" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="procurement-notes">Note for pharmacy (optional)</label>
            <textarea id="procurement-notes" className="form-textarea" rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !pharmacies.length}>
              <PackageSearch size={16} />
              <span>{isSubmitting ? 'Sending...' : 'Send Request'}</span>
              <Send size={15} />
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
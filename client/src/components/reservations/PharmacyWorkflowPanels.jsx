import React, { useEffect, useState } from 'react';
import { Bell, FileCheck2, PackageSearch, ShieldCheck } from 'lucide-react';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import { notificationService, prescriptionService, procurementService } from '../../services/api';

export default function PharmacyWorkflowPanels() {
  const [requests, setRequests] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alert, setAlert] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestStatus, setRequestStatus] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [arrival, setArrival] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [holdHours, setHoldHours] = useState(24);
  const [reviewNotes, setReviewNotes] = useState({});

  const refresh = async () => {
    try {
      const [requestResponse, prescriptionResponse, notificationResponse] = await Promise.all([
        procurementService.getPharmacyRequests(),
        prescriptionService.getPharmacyPrescriptions(),
        notificationService.getMine()
      ]);
      setRequests(requestResponse.data.data || []);
      setPrescriptions(prescriptionResponse.data.data || []);
      setNotifications(notificationResponse.data.data || []);
    } catch (error) {
      setAlert({ type: 'danger', message: error.response?.data?.message || 'Failed to load pharmacy workflow updates.' });
    }
  };

  useEffect(() => { refresh(); }, []);

  const openRequestUpdate = (request, status) => {
    setSelectedRequest(request);
    setRequestStatus(status);
    setRequestNotes('');
    setArrival(request.estimated_arrival ? new Date(request.estimated_arrival).toISOString().slice(0, 16) : '');
    setExpectedPrice(request.expected_price ?? '');
    setHoldHours(request.hold_duration_hours || 24);
  };

  const saveRequestUpdate = async (event) => {
    event.preventDefault();
    try {
      await procurementService.updateStatus(selectedRequest.id, {
        status: requestStatus,
        notes: requestNotes,
        estimatedArrival: arrival || undefined,
        expectedPrice: expectedPrice === '' ? undefined : Number(expectedPrice),
        holdDurationHours: Number(holdHours)
      });
      setSelectedRequest(null);
      setAlert({ type: 'success', message: `Procurement request updated to ${requestStatus}.` });
      await refresh();
    } catch (error) {
      setAlert({ type: 'danger', message: error.response?.data?.message || 'Failed to update procurement request.' });
    }
  };

  const reviewPrescription = async (prescription, status) => {
    const notes = reviewNotes[prescription.id] || '';
    if (status === 'Rejected' && !notes.trim()) {
      setAlert({ type: 'danger', message: 'Enter a reason before rejecting a prescription.' });
      return;
    }
    try {
      await prescriptionService.review(prescription.id, { status, notes });
      setAlert({ type: 'success', message: `Prescription ${status.toLowerCase()}.` });
      await refresh();
    } catch (error) {
      setAlert({ type: 'danger', message: error.response?.data?.message || 'Failed to review prescription.' });
    }
  };

  const previewPrescription = async (prescription) => {
    const preview = window.open('about:blank', '_blank');
    try {
      const response = await prescriptionService.getFile(prescription.id);
      const fileUrl = URL.createObjectURL(response.data);
      if (preview) preview.location = fileUrl;
      else window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      if (preview) preview.close();
      setAlert({ type: 'danger', message: error.response?.data?.message || 'Could not open prescription file.' });
    }
  };

  const markNotificationRead = async (notification) => {
    if (notification.read_at) return;
    try {
      await notificationService.markRead(notification.id);
      setNotifications(current => current.map(item => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const actionButtons = (request) => {
    if (request.status === 'Pending') return <>
      <button className="btn btn-outline btn-sm" onClick={() => openRequestUpdate(request, 'Rejected')}>Reject</button>
      <button className="btn btn-primary btn-sm" onClick={() => openRequestUpdate(request, 'Accepted')}>Accept</button>
    </>;
    if (['Accepted', 'Ordered', 'Delayed'].includes(request.status)) return <>
      {request.status !== 'Ordered' && <button className="btn btn-outline btn-sm" onClick={() => openRequestUpdate(request, 'Ordered')}>Mark ordered</button>}
      <button className="btn btn-outline btn-sm" onClick={() => openRequestUpdate(request, 'Delayed')}>Report delay</button>
      <button className="btn btn-primary btn-sm" onClick={() => openRequestUpdate(request, 'Ready for Pickup')}>Mark arrived & ready</button>
      <button className="btn btn-ghost btn-sm" onClick={() => openRequestUpdate(request, 'Cancelled')}>Cannot procure</button>
    </>;
    if (request.status === 'Ready for Pickup') return <>
      <button className="btn btn-primary btn-sm" onClick={() => openRequestUpdate(request, 'Completed')}>Mark collected</button>
      <button className="btn btn-ghost btn-sm" onClick={() => openRequestUpdate(request, 'Cancelled')}>Cancel & release stock</button>
    </>;
    return null;
  };

  return (
    <div style={{ display: 'grid', gap: '18px', marginBottom: '28px' }}>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <section className="card" style={{ padding: '24px' }}>
        <div className="card-header-flex">
          <div>
            <h2 className="card-heading"><PackageSearch size={18} /> Medicine Procurement</h2>
            <p className="card-subheading">Respond to patient requests and update arrival estimates.</p>
          </div>
        </div>
        {!requests.length ? <p className="card-subheading" style={{ marginTop: '14px' }}>No procurement requests.</p> : (
          <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
            {requests.map(request => (
              <article key={request.id} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{request.brand_name} ({request.strength})</strong>
                    <p className="card-subheading" style={{ marginTop: '4px' }}>
                      {request.quantity} unit(s) · Request {request.request_code} · Patient {request.patient_name} · {request.patient_phone}
                    </p>
                  </div>
                  <span className="badge badge-primary">{request.status}</span>
                </div>
                {request.patient_notes && <p style={{ marginTop: '8px' }}>Patient note: {request.patient_notes}</p>}
                {request.estimated_arrival && <p className="card-subheading">Expected arrival: {new Date(request.estimated_arrival).toLocaleString()}</p>}
                {request.pharmacy_notes && <p className="card-subheading">Your update: {request.pharmacy_notes}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {actionButtons(request)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card" style={{ padding: '24px' }}>
        <div className="card-header-flex">
          <div>
            <h2 className="card-heading"><ShieldCheck size={18} /> Prescription Verification</h2>
            <p className="card-subheading">Review documents for medicines requiring a prescription.</p>
          </div>
        </div>
        {!prescriptions.length ? <p className="card-subheading" style={{ marginTop: '14px' }}>No prescription uploads.</p> : (
          <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
            {prescriptions.map(prescription => (
              <article key={prescription.id} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{prescription.brand_name} ({prescription.strength})</strong>
                    <p className="card-subheading" style={{ marginTop: '4px' }}>{prescription.patient_name} · {prescription.original_filename}</p>
                  </div>
                  <span className={`badge ${prescription.status === 'Verified' ? 'badge-success' : prescription.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{prescription.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => previewPrescription(prescription)}>View secure file</button>
                  {prescription.status === 'Pending' && <>
                    <input
                      className="form-input"
                      aria-label={`Review note for ${prescription.original_filename}`}
                      placeholder="Rejection reason if declining"
                      value={reviewNotes[prescription.id] || ''}
                      onChange={(event) => setReviewNotes(current => ({ ...current, [prescription.id]: event.target.value }))}
                      style={{ maxWidth: '260px' }}
                    />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => reviewPrescription(prescription, 'Rejected')}>Reject</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => reviewPrescription(prescription, 'Verified')}><FileCheck2 size={15} /> Verify</button>
                  </>}
                </div>
                {prescription.review_notes && <p className="card-subheading" style={{ marginTop: '8px' }}>Review note: {prescription.review_notes}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {notifications.length > 0 && (
        <section className="card" style={{ padding: '24px' }}>
          <h2 className="card-heading"><Bell size={18} /> Activity Updates</h2>
          <div style={{ display: 'grid', gap: '6px', marginTop: '12px' }}>
            {notifications.slice(0, 8).map(notification => (
              <button key={notification.id} type="button" onClick={() => markNotificationRead(notification)} style={{ textAlign: 'left', border: 0, padding: '10px', background: notification.read_at ? 'transparent' : 'var(--color-primary-subtle)', color: 'inherit' }}>
                <strong>{notification.title}</strong><span style={{ display: 'block', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>{notification.message}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedRequest && (
        <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title={`Update request: ${requestStatus}`}>
          <form onSubmit={saveRequestUpdate}>
            {['Accepted', 'Ordered', 'Delayed'].includes(requestStatus) && (
              <div className="form-group">
                <label className="form-label">Estimated arrival</label>
                <input type="datetime-local" className="form-input" value={arrival} onChange={(event) => setArrival(event.target.value)} required={['Accepted', 'Delayed'].includes(requestStatus)} />
              </div>
            )}
            {['Accepted', 'Ordered'].includes(requestStatus) && (
              <div className="form-group">
                <label className="form-label">Expected price (optional)</label>
                <input type="number" min="0" step="0.01" className="form-input" value={expectedPrice} onChange={(event) => setExpectedPrice(event.target.value)} />
              </div>
            )}
            {requestStatus === 'Ready for Pickup' && (
              <div className="form-group">
                <label className="form-label">Pickup hold (hours)</label>
                <input type="number" min="1" max="168" className="form-input" value={holdHours} onChange={(event) => setHoldHours(event.target.value)} required />
              </div>
            )}
            {['Rejected', 'Delayed', 'Cancelled'].includes(requestStatus) && (
              <div className="form-group">
                <label className="form-label">Update for patient</label>
                <textarea className="form-textarea" rows="3" value={requestNotes} onChange={(event) => setRequestNotes(event.target.value)} required={['Rejected', 'Delayed', 'Cancelled'].includes(requestStatus)} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedRequest(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save update</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
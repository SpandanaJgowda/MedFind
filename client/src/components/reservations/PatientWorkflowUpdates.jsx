import React, { useEffect, useState } from 'react';
import { Bell, Clock, PackageCheck, Store } from 'lucide-react';
import { notificationService, procurementService } from '../../services/api';

export default function PatientWorkflowUpdates() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([procurementService.getPatientRequests(), notificationService.getMine()])
      .then(([requestResponse, notificationResponse]) => {
        if (!active) return;
        setRequests(requestResponse.data.data || []);
        setNotifications(notificationResponse.data.data || []);
      })
      .catch(error => console.error('Failed to load patient workflow updates:', error));
    return () => { active = false; };
  }, []);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(current => current.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(current => current.map(item => ({ ...item, read_at: new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  if (!requests.length && !notifications.length) return null;

  return (
    <div style={{ display: 'grid', gap: '18px', marginBottom: '28px' }}>
      {requests.length > 0 && (
        <section className="card" style={{ padding: '24px' }}>
          <div className="card-header-flex">
            <div>
              <h2 className="card-heading">Medicine Procurement Requests</h2>
              <p className="card-subheading">Track pharmacy responses and collection windows.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            {requests.map(request => (
              <article key={request.id} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{request.brand_name} ({request.strength})</strong>
                    <div className="card-subheading" style={{ marginTop: '4px' }}>
                      Request {request.request_code} · {request.quantity} unit(s) · {request.pharmacy_name}, {request.pharmacy_city}
                    </div>
                  </div>
                  <span className={`badge ${request.status === 'Ready for Pickup' ? 'badge-success' : request.status === 'Rejected' || request.status === 'Cancelled' ? 'badge-danger' : 'badge-primary'}`}>
                    {request.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', color: 'var(--color-text-muted)', fontSize: '0.86rem', marginTop: '10px' }}>
                  {request.estimated_arrival && <span><Clock size={14} /> Expected arrival: {new Date(request.estimated_arrival).toLocaleString()}</span>}
                  {request.expected_price !== null && <span>Expected price: ₹{request.expected_price}</span>}
                  {request.pickup_deadline && <span><PackageCheck size={14} /> Collect by: {new Date(request.pickup_deadline).toLocaleString()}</span>}
                </div>
                {request.pharmacy_notes && <p style={{ marginTop: '8px', color: 'var(--color-text-muted)' }}>Pharmacy update: {request.pharmacy_notes}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {notifications.length > 0 && (
        <section className="card" style={{ padding: '24px' }}>
          <div className="card-header-flex">
            <div>
              <h2 className="card-heading"><Bell size={18} /> Updates</h2>
              <p className="card-subheading">Booking, procurement, and prescription status notifications.</p>
            </div>
            {notifications.some(item => !item.read_at) && (
              <button type="button" className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          <div style={{ display: 'grid', gap: '8px', marginTop: '14px' }}>
            {notifications.slice(0, 10).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => !item.read_at && markRead(item.id)}
                style={{ display: 'flex', gap: '10px', textAlign: 'left', border: 0, borderRadius: '6px', padding: '10px', background: item.read_at ? 'transparent' : 'var(--color-primary-subtle)', color: 'inherit', cursor: item.read_at ? 'default' : 'pointer' }}
              >
                <Store size={16} className="text-primary" />
                <span>
                  <strong>{item.title}</strong>
                  <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>{item.message}</span>
                  <span style={{ display: 'block', color: 'var(--color-text-light)', fontSize: '0.76rem', marginTop: '3px' }}>{new Date(item.created_at).toLocaleString()}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { CalendarCheck, Search, Filter, Store, User, Clock, FileText } from 'lucide-react';
import { adminService } from '../../services/api';
import Alert from '../../components/common/Alert';
import './AdminDashboard.css';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getReservations({ search, status: statusFilter, limit: 100 });
      if (res.data.success) {
        setReservations(res.data.data || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to load reservations.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [search, statusFilter]);

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
          Platform Reservations Audit
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '4px' }}>
          Complete network audit trail of all patient medicine discovery reservations and pharmacy pickups.
        </p>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <Search size={18} className="text-muted" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', padding: '6px 0', fontSize: '0.95rem' }}
              placeholder="Search by reservation code, patient name, or pharmacy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'Pending', label: 'Pending' },
              { id: 'Confirmed', label: 'Confirmed' },
              { id: 'Ready for Pickup', label: 'Ready for Pickup' },
              { id: 'Completed', label: 'Completed' },
              { id: 'Cancelled', label: 'Cancelled' },
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
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading platform reservations...
          </div>
        ) : reservations.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <CalendarCheck size={48} className="text-light" style={{ margin: '0 auto 16px auto' }} />
            <h3>No Reservations Found</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>No records match the current filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Reservation Code</th>
                  <th>Medicine</th>
                  <th>Patient</th>
                  <th>Pharmacy</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reserved At</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="code-text" style={{ fontSize: '0.95rem' }}>{r.reservation_code}</span>
                    </td>
                    <td>
                      <div className="med-cell">
                        <strong>{r.brand_name || r.medicine_name}</strong>
                        <span className="cell-sub">{r.strength} • {r.dosage_form}</span>
                      </div>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{r.patient_name}</strong>
                        <span className="cell-sub">{r.patient_phone}</span>
                      </div>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{r.pharmacy_name}</strong>
                        <span className="cell-sub">{r.pharmacy_city}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>₹{r.total_price}</strong>
                        <span className="cell-sub" style={{ display: 'block' }}>{r.quantity} unit{r.quantity > 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${r.status === 'Ready for Pickup' ? 'success' : r.status === 'Confirmed' ? 'primary' : r.status === 'Pending' ? 'warning' : 'neutral'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {new Date(r.reserved_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

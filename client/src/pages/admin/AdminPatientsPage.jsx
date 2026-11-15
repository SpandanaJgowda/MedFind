import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, CheckCircle2, Phone, Mail, CalendarCheck } from 'lucide-react';
import { adminService } from '../../services/api';
import Alert from '../../components/common/Alert';
import './AdminDashboard.css';

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPatients({ search, status: statusFilter });
      if (res.data.success) {
        setPatients(res.data.data || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to load patient accounts.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, statusFilter]);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await adminService.updateUserStatus(user.id, nextStatus);
      if (res.data.success) {
        setAlert({ type: 'success', message: `User status changed to ${nextStatus}.` });
        fetchPatients();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to update user status.' });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
          Patient Accounts & User Management
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '4px' }}>
          View registered patients, track reservation histories, and manage system access permissions.
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
              placeholder="Search by patient name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'active', 'suspended'].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading registered patient accounts...
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Users size={48} className="text-light" style={{ margin: '0 auto 16px auto' }} />
            <h3>No Patients Found</h3>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Total Reservations</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>{p.email}</td>
                    <td>{p.phone || 'N/A'}</td>
                    <td>
                      <strong>{p.total_reservations || 0}</strong> ({p.completed_reservations || 0} completed)
                    </td>
                    <td>
                      <span className={`badge badge-${p.status === 'active' ? 'success' : 'danger'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn btn-sm ${p.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => handleToggleStatus(p)}
                      >
                        {p.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
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

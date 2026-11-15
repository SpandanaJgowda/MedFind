import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Store, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  FileText,
  Ban
} from 'lucide-react';
import { adminService } from '../../services/api';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import './AdminDashboard.css';

export default function AdminPharmaciesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [pharmacies, setPharmacies] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchPharmacies = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPharmacies({ status: statusFilter, search });
      if (res.data.success) {
        setPharmacies(res.data.data || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to load pharmacies.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, [statusFilter, search]);

  const handleApprove = async (id) => {
    try {
      const res = await adminService.approvePharmacy(id);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Pharmacy approved and inventory activated.' });
        fetchPharmacies();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to approve pharmacy.' });
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await adminService.rejectPharmacy(id);
      if (res.data.success) {
        setAlert({ type: 'warning', message: 'Pharmacy registration rejected.' });
        fetchPharmacies();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to reject pharmacy.' });
    }
  };

  const handleSuspend = async (id) => {
    try {
      const res = await adminService.suspendPharmacy(id);
      if (res.data.success) {
        setAlert({ type: 'warning', message: 'Pharmacy suspended. Public inventory listing disabled.' });
        fetchPharmacies();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to suspend pharmacy.' });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
          Pharmacy Partner Verifications & Management
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '4px' }}>
          Inspect pharmacy credentials, verify state drug control licenses, and manage network authorizations.
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
              placeholder="Search by pharmacy name, owner, license or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Pharmacies' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'approved', label: 'Approved Active' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'suspended', label: 'Suspended' }
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
            Loading pharmacies...
          </div>
        ) : pharmacies.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Store size={48} className="text-light" style={{ margin: '0 auto 16px auto' }} />
            <h3>No Pharmacies Found</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>No pharmacy records match the current filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Pharmacy Name</th>
                  <th>License Number</th>
                  <th>Owner / Contact</th>
                  <th>Location</th>
                  <th>Inventory Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="med-cell">
                        <strong>{p.name}</strong>
                        <span className="cell-sub">Registered: {new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className="code-text" style={{ fontSize: '0.85rem' }}>{p.license_number}</span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <span>{p.owner_name}</span>
                        <span className="cell-sub">{p.phone} • {p.user_email}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{p.address}, {p.city}</span>
                    </td>
                    <td>
                      <strong>{p.inventory_count || 0}</strong> medicines listed
                    </td>
                    <td>
                      <span className={`badge badge-${p.approval_status === 'approved' ? 'success' : p.approval_status === 'pending' ? 'warning' : 'danger'}`}>
                        {p.approval_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {p.approval_status === 'pending' && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApprove(p.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(p.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {p.approval_status === 'approved' && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                            onClick={() => handleSuspend(p.id)}
                          >
                            <Ban size={14} />
                            <span>Suspend</span>
                          </button>
                        )}
                        {p.approval_status === 'suspended' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(p.id)}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
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

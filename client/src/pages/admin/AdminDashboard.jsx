import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Store, 
  Users, 
  Pill, 
  CalendarCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Search,
  Activity
} from 'lucide-react';
import { adminService } from '../../services/api';
import SimpleBarChart from '../../components/charts/SimpleBarChart';
import SimpleDonutChart from '../../components/charts/SimpleDonutChart';
import Alert from '../../components/common/Alert';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getStats();
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setAlert({ type: 'danger', message: 'Failed to retrieve administrative statistics.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApprove = async (pharmacyId) => {
    try {
      const res = await adminService.approvePharmacy(pharmacyId);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Pharmacy approved successfully.' });
        fetchStats();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to approve pharmacy.' });
    }
  };

  const handleReject = async (pharmacyId) => {
    try {
      const res = await adminService.rejectPharmacy(pharmacyId);
      if (res.data.success) {
        setAlert({ type: 'warning', message: 'Pharmacy registration rejected.' });
        fetchStats();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to reject pharmacy.' });
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading platform administrator dashboard...
      </div>
    );
  }

  // Pharmacy Donut segments
  const pharmacySegments = [
    { label: 'Approved', value: stats?.approvedPharmacies || 0, color: 'var(--color-accent)' },
    { label: 'Pending Approval', value: stats?.pendingApprovals || 0, color: 'var(--color-warning)' },
    { label: 'Rejected', value: stats?.rejectedPharmacies || 0, color: 'var(--color-danger)' },
    { label: 'Suspended', value: stats?.suspendedPharmacies || 0, color: '#64748B' }
  ];

  // Top searched queries bar chart
  const searchChartData = (stats?.topSearched || []).map(s => ({
    label: s.query,
    value: s.search_count
  }));

  // Top reserved medicines
  const topReservedData = (stats?.topReserved || []).map(r => ({
    label: r.brand_name || r.name,
    value: r.reservation_count
  }));

  return (
    <div className="admin-dashboard-page">
      {/* Banner */}
      <section className="admin-banner">
        <div className="container">
          <div className="admin-banner-inner">
            <div className="admin-badge">
              <Shield size={16} />
              <span>System Administrator Control Center</span>
            </div>
            <h1 className="admin-title">MediFind Platform Overview</h1>
            <p className="admin-sub">
              Monitor network health, approve pharmacy licenses, manage global medicine catalogs, and oversee all platform reservations.
            </p>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingTop: '32px' }}>
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Pending Approvals Callout Banner if any */}
        {(stats?.pendingApprovals || 0) > 0 && (
          <div className="pending-approvals-action-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={24} className="text-warning" />
              <div>
                <strong>{stats.pendingApprovals} Pharmacy Registration{stats.pendingApprovals > 1 ? 's' : ''} Awaiting Approval</strong>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Review credentials and verify state licenses to allow pharmacies to publish stock.
                </p>
              </div>
            </div>
            <Link to="/admin/pharmacies?status=pending" className="btn btn-primary btn-sm">
              Review Registrations
            </Link>
          </div>
        )}

        {/* 6 Metric Cards */}
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <div className="ametric-icon bg-primary-light text-primary">
              <Users size={22} />
            </div>
            <div className="ametric-info">
              <span className="ametric-num">{stats?.totalPatients || 0}</span>
              <span className="ametric-label">Total Patients</span>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="ametric-icon bg-secondary-light text-secondary">
              <Store size={22} />
            </div>
            <div className="ametric-info">
              <span className="ametric-num">{stats?.totalPharmacies || 0}</span>
              <span className="ametric-label">Total Pharmacies</span>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="ametric-icon bg-success-light text-success">
              <CheckCircle2 size={22} />
            </div>
            <div className="ametric-info">
              <span className="ametric-num">{stats?.approvedPharmacies || 0}</span>
              <span className="ametric-label">Approved Pharmacies</span>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="ametric-icon bg-warning-light text-warning">
              <Clock size={22} />
            </div>
            <div className="ametric-info">
              <span className="ametric-num">{stats?.pendingApprovals || 0}</span>
              <span className="ametric-label">Pending Verifications</span>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="ametric-icon bg-primary-light text-primary">
              <Pill size={22} />
            </div>
            <div className="ametric-info">
              <span className="ametric-num">{stats?.totalMedicines || 0}</span>
              <span className="ametric-label">Catalog Medicines</span>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="ametric-icon bg-secondary-light text-secondary">
              <CalendarCheck size={22} />
            </div>
            <div className="ametric-info">
              <span className="ametric-num">{stats?.totalReservations || 0}</span>
              <span className="ametric-label">Total Reservations</span>
            </div>
          </div>
        </div>

        {/* Charts 2-Column Row */}
        <div className="charts-grid-2col" style={{ marginBottom: '28px' }}>
          {/* Pharmacy Status Donut */}
          <div className="card chart-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-heading">Pharmacy Partner Verification</h3>
                <p className="card-subheading">Breakdown by credential approval status</p>
              </div>
              <Link to="/admin/pharmacies" className="btn btn-outline btn-sm">
                Manage All
              </Link>
            </div>
            <SimpleDonutChart segments={pharmacySegments} />
          </div>

          {/* Top Searched Queries Bar Chart */}
          <div className="card chart-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-heading">Most Searched Medicines</h3>
                <p className="card-subheading">Highest demand patient search queries</p>
              </div>
            </div>
            <SimpleBarChart
              data={searchChartData}
              labelKey="label"
              valueKey="value"
              height={160}
              color="var(--color-secondary)"
            />
          </div>
        </div>

        {/* Recent Pharmacy Registrations Table */}
        <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-heading">Recent Pharmacy Registrations</h3>
              <p className="card-subheading">Chemist partners requiring verification</p>
            </div>
            <Link to="/admin/pharmacies" className="btn btn-outline btn-sm">
              View All Pharmacies
            </Link>
          </div>

          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Pharmacy Name</th>
                  <th>License Number</th>
                  <th>Owner / Contact</th>
                  <th>City</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentPharmacies || []).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="med-cell">
                        <strong>{p.name}</strong>
                        <span className="cell-sub">{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className="code-text">{p.license_number}</span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <span>{p.owner_name}</span>
                        <span className="cell-sub">{p.phone}</span>
                      </div>
                    </td>
                    <td>{p.city}</td>
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
                          <Link to="/admin/pharmacies" className="btn btn-ghost btn-sm">
                            Manage
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="admin-shortcuts-grid">
          <Link to="/admin/pharmacies" className="admin-shortcut-card">
            <Store size={24} className="text-primary" />
            <div>
              <strong>Pharmacy Management</strong>
              <p>Verify licenses, view inventories, approve or suspend chemists</p>
            </div>
            <ArrowRight size={16} />
          </Link>

          <Link to="/admin/medicines" className="admin-shortcut-card">
            <Pill size={24} className="text-secondary" />
            <div>
              <strong>Medicine Catalog</strong>
              <p>Add new medicines, define formulations, and manage categories</p>
            </div>
            <ArrowRight size={16} />
          </Link>

          <Link to="/admin/reservations" className="admin-shortcut-card">
            <CalendarCheck size={24} className="text-success" />
            <div>
              <strong>Reservations Audit</strong>
              <p>Track all patient reservations, pickup codes, and dispensing rates</p>
            </div>
            <ArrowRight size={16} />
          </Link>

          <Link to="/admin/patients" className="admin-shortcut-card">
            <Users size={24} className="text-warning" />
            <div>
              <strong>Patient Accounts</strong>
              <p>View registered patients and manage account access</p>
            </div>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

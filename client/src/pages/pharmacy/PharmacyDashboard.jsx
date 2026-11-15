import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Pill, 
  CalendarCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService, reservationService } from '../../services/api';
import SimpleBarChart from '../../components/charts/SimpleBarChart';
import SimpleDonutChart from '../../components/charts/SimpleDonutChart';
import Alert from '../../components/common/Alert';
import './PharmacyDashboard.css';

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await pharmacyService.getStats();
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load pharmacy dashboard stats:', err);
      setError('Failed to retrieve pharmacy metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await reservationService.updateStatus(id, { status });
      if (res.data.success) {
        setActionMsg(`Reservation marked as ${status}.`);
        fetchStats();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reservation.');
    }
  };

  const isApproved = user?.pharmacy?.approval_status === 'approved' || user?.approval_status === 'approved';

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading pharmacy dashboard data...
      </div>
    );
  }

  const inventoryStats = stats?.inventory || {};
  const resStats = stats?.reservations || {};

  // Donut chart segments for inventory
  const inventorySegments = [
    { label: 'Available', value: inventoryStats.available_count || 0, color: 'var(--color-accent)' },
    { label: 'Low Stock', value: inventoryStats.low_stock_count || 0, color: 'var(--color-warning)' },
    { label: 'Out of Stock', value: inventoryStats.out_of_stock_count || 0, color: 'var(--color-danger)' }
  ];

  // Bar chart data for top reserved
  const topReservedChartData = (stats?.topReserved || []).map(r => ({
    label: r.brand_name || r.name,
    value: r.reservation_count
  }));

  return (
    <div className="pharmacy-dashboard-page">
      {/* Top Banner */}
      <section className="pharmacy-header-banner">
        <div className="container">
          <div className="pharm-header-content">
            <div className="pharm-avatar">
              <Store size={32} />
            </div>
            <div>
              <div className="pharm-license-tag">
                <span>LICENSE: {user?.pharmacy?.license_number || 'VERIFIED'}</span>
                {isApproved ? (
                  <span className="badge badge-success">Approved Partner</span>
                ) : (
                  <span className="badge badge-warning">Pending Admin Approval</span>
                )}
              </div>
              <h1 className="pharm-title">{user?.pharmacy?.name || 'Pharmacy Partner Portal'}</h1>
              <p className="pharm-sub">
                Manage your digital medicine shelf, accept customer reservations, and monitor inventory movements.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingTop: '32px' }}>
        {actionMsg && <Alert type="success" message={actionMsg} onClose={() => setActionMsg(null)} />}
        {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

        {/* Approval Alert Banner if pending */}
        {!isApproved && (
          <div className="pending-approval-banner">
            <AlertCircle size={24} className="text-warning flex-shrink-0" />
            <div>
              <strong>Account Pending Administrator Verification</strong>
              <p>
                Your pharmacy registration is currently undergoing administrative compliance check. You can add and configure inventory, but it will be visible on patient searches once approved.
              </p>
            </div>
          </div>
        )}

        {/* Analytics Cards Grid */}
        <div className="pharmacy-metrics-grid">
          <div className="pharm-metric-card">
            <div className="pmetric-icon bg-primary-light text-primary">
              <Pill size={24} />
            </div>
            <div className="pmetric-data">
              <span className="pmetric-num">{inventoryStats.total_medicines || 0}</span>
              <span className="pmetric-label">Total Medicines</span>
            </div>
          </div>

          <div className="pharm-metric-card">
            <div className="pmetric-icon bg-success-light text-success">
              <PackageCheck size={24} />
            </div>
            <div className="pmetric-data">
              <span className="pmetric-num">{inventoryStats.available_count || 0}</span>
              <span className="pmetric-label">In Stock & Ready</span>
            </div>
          </div>

          <div className="pharm-metric-card">
            <div className="pmetric-icon bg-warning-light text-warning">
              <AlertTriangle size={24} />
            </div>
            <div className="pmetric-data">
              <span className="pmetric-num">{inventoryStats.low_stock_count || 0}</span>
              <span className="pmetric-label">Low Stock Alerts</span>
            </div>
          </div>

          <div className="pharm-metric-card">
            <div className="pmetric-icon bg-danger-light text-danger">
              <AlertCircle size={24} />
            </div>
            <div className="pmetric-data">
              <span className="pmetric-num">{inventoryStats.out_of_stock_count || 0}</span>
              <span className="pmetric-label">Out of Stock</span>
            </div>
          </div>

          <div className="pharm-metric-card">
            <div className="pmetric-icon bg-secondary-light text-secondary">
              <CalendarCheck size={24} />
            </div>
            <div className="pmetric-data">
              <span className="pmetric-num">{resStats.pending_count || 0}</span>
              <span className="pmetric-label">Pending Pickups</span>
            </div>
          </div>

          <div className="pharm-metric-card">
            <div className="pmetric-icon bg-accent-light text-primary">
              <TrendingUp size={24} />
            </div>
            <div className="pmetric-data">
              <span className="pmetric-num">{resStats.completed_count || 0}</span>
              <span className="pmetric-label">Dispensed Orders</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid-2col">
          {/* Inventory Distribution Donut */}
          <div className="card chart-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-heading">Inventory Stock Distribution</h3>
                <p className="card-subheading">Breakdown of active stock health</p>
              </div>
              <Link to="/pharmacy/inventory" className="btn btn-outline btn-sm">
                Manage Stock
              </Link>
            </div>
            <SimpleDonutChart segments={inventorySegments} />
          </div>

          {/* Most Reserved Medicines Bar Chart */}
          <div className="card chart-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-heading">Most Reserved Medicines</h3>
                <p className="card-subheading">Highest reservation volume</p>
              </div>
            </div>
            <SimpleBarChart
              data={topReservedChartData}
              labelKey="label"
              valueKey="value"
              height={160}
              color="var(--color-primary)"
            />
          </div>
        </div>

        {/* Incoming Patient Reservations Table */}
        <div className="card" style={{ padding: '24px', marginTop: '28px' }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-heading">Recent Incoming Reservations</h3>
              <p className="card-subheading">Patient orders waiting for confirmation and pickup</p>
            </div>
            <Link to="/pharmacy/reservations" className="btn btn-primary btn-sm">
              View All Reservations
            </Link>
          </div>

          {(stats?.recentReservations || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
              No incoming reservations yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Medicine</th>
                    <th>Quantity</th>
                    <th>Total Price</th>
                    <th>Patient</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentReservations || []).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong className="code-text">{r.reservation_code}</strong>
                      </td>
                      <td>
                        <div className="med-cell">
                          <strong>{r.brand_name}</strong>
                          <span className="cell-sub">{r.strength} • {r.dosage_form}</span>
                        </div>
                      </td>
                      <td>{r.quantity} units</td>
                      <td>
                        <strong>₹{r.total_price}</strong>
                      </td>
                      <td>
                        <div className="patient-cell">
                          <span>{r.patient_name}</span>
                          <span className="cell-sub">{r.patient_phone}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${r.status === 'Ready for Pickup' ? 'success' : r.status === 'Confirmed' ? 'primary' : r.status === 'Pending' ? 'warning' : 'neutral'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {r.status === 'Pending' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleUpdateStatus(r.id, 'Confirmed')}
                            >
                              Accept
                            </button>
                          )}
                          {r.status === 'Confirmed' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleUpdateStatus(r.id, 'Ready for Pickup')}
                            >
                              Ready
                            </button>
                          )}
                          {r.status === 'Ready for Pickup' && (
                            <button
                              className="btn btn-success btn-sm"
                              style={{ backgroundColor: '#059669', color: '#FFF' }}
                              onClick={() => handleUpdateStatus(r.id, 'Completed')}
                            >
                              Complete
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
    </div>
  );
}

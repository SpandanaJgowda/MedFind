import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  AlertCircle, 
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { pharmacyService, medicineService } from '../../services/api';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import './PharmacyDashboard.css';

export default function InventoryManagementPage() {
  const [inventory, setInventory] = useState([]);
  const [catalogMedicines, setCatalogMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'available', 'low_stock', 'out_of_stock'
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [activeItem, setActiveItem] = useState(null);

  // Add item form state
  const [addForm, setAddForm] = useState({
    medicineId: '',
    price: '',
    quantity: '',
    minStockLevel: '5'
  });

  // Edit item form state
  const [editForm, setEditForm] = useState({
    price: '',
    quantity: '',
    minStockLevel: '5'
  });

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await pharmacyService.getInventory({ search, status: statusFilter });
      if (res.data.success) {
        setInventory(res.data.data || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to load inventory.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, statusFilter]);

  // Load catalog medicines for the Add modal
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await medicineService.search({ limit: 100 });
        if (res.data.success) {
          setCatalogMedicines(res.data.data || []);
        }
      } catch (err) {
        console.error('Catalog load error:', err);
      }
    }
    loadCatalog();
  }, []);

  const handleOpenAddModal = () => {
    setAddForm({ medicineId: '', price: '', quantity: '', minStockLevel: '5' });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await pharmacyService.addInventoryItem(addForm);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Medicine added to inventory successfully.' });
        setIsAddModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to add medicine.' });
    }
  };

  const handleOpenEditModal = (item) => {
    setActiveItem(item);
    setEditForm({
      price: item.price,
      quantity: item.quantity,
      minStockLevel: item.min_stock_level
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    try {
      const res = await pharmacyService.updateInventoryItem(activeItem.id, editForm);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Inventory item updated successfully.' });
        setIsEditModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to update item.' });
    }
  };

  const handleOpenDeleteModal = (item) => {
    setActiveItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!activeItem) return;
    try {
      const res = await pharmacyService.deleteInventoryItem(activeItem.id);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Medicine removed from inventory.' });
        setIsDeleteModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to delete inventory record.' });
    }
  };

  const getAvailabilityBadge = (status) => {
    if (status === 'Available') {
      return <span className="badge badge-success">Available</span>;
    }
    if (status === 'Low Stock') {
      return <span className="badge badge-warning">Low Stock</span>;
    }
    return <span className="badge badge-danger">Out of Stock</span>;
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
            Pharmacy Inventory Management
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '4px' }}>
            Update medicine stock levels, retail pricing, and set minimum safety thresholds.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>Add Medicine to Stock</span>
        </button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '260px' }}>
            <Search size={18} className="text-muted" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', padding: '6px 0', fontSize: '0.95rem' }}
              placeholder="Search by brand name, generic or ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'available', label: 'In Stock' },
              { id: 'low_stock', label: 'Low Stock Alerts' },
              { id: 'out_of_stock', label: 'Out of Stock' }
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

      {/* Inventory Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading inventory items...
          </div>
        ) : inventory.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Pill size={48} className="text-light" style={{ margin: '0 auto 16px auto' }} />
            <h3>No Medicines in Inventory</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: '8px auto 20px auto', maxWidth: '420px' }}>
              Add items from the national medicine catalog to start receiving patient reservations.
            </p>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
              <Plus size={16} />
              <span>Add Your First Medicine</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Medicine / Formulation</th>
                  <th>Strength & Form</th>
                  <th>Price (₹)</th>
                  <th>Quantity In Stock</th>
                  <th>Min Safety Level</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="med-cell">
                        <strong>{item.brand_name}</strong>
                        <span className="cell-sub">{item.generic_name}</span>
                        <span className="cell-sub" style={{ fontSize: '0.72rem', color: 'var(--color-primary)' }}>
                          {item.manufacturer}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{item.strength}</span>{' '}
                      <span className="badge badge-neutral">{item.dosage_form}</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                        ₹{parseFloat(item.price).toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1.1rem' }}>{item.quantity}</strong> units
                    </td>
                    <td>{item.min_stock_level} units</td>
                    <td>{getAvailabilityBadge(item.availability_status)}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                      {new Date(item.last_updated).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit Price & Quantity"
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenDeleteModal(item)}
                          title="Remove from inventory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Medicine to Pharmacy Inventory"
      >
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label className="form-label">Select Medicine from Global Catalog</label>
            <select
              className="form-select"
              value={addForm.medicineId}
              onChange={(e) => setAddForm({ ...addForm, medicineId: e.target.value })}
              required
            >
              <option value="">-- Choose a medicine --</option>
              {catalogMedicines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.brand_name} ({m.generic_name}) - {m.strength} {m.dosage_form} [{m.manufacturer}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-3col">
            <div className="form-group">
              <label className="form-label">Retail Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="e.g. 32.50"
                value={addForm.price}
                onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Available Stock Qty</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="e.g. 50"
                value={addForm.quantity}
                onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Stock Threshold</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={addForm.minStockLevel}
                onChange={(e) => setAddForm({ ...addForm, minStockLevel: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add to Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Inventory Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Stock: ${activeItem?.brand_name || ''}`}
      >
        <form onSubmit={handleEditSubmit}>
          <div className="form-row-3col">
            <div className="form-group">
              <label className="form-label">Price per Unit (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Available Quantity</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Stock Alert Level</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={editForm.minStockLevel}
                onChange={(e) => setEditForm({ ...editForm, minStockLevel: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove Medicine from Inventory"
      >
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          Are you sure you want to remove <strong>{activeItem?.brand_name}</strong> from your pharmacy's public inventory? Patients will no longer find this item at your store.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDeleteSubmit}
          >
            Confirm Removal
          </button>
        </div>
      </Modal>
    </div>
  );
}

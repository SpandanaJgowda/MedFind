import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  ShieldCheck, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { adminService, medicineService } from '../../services/api';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import './AdminDashboard.css';

export default function AdminMedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeMedicine, setActiveMedicine] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    brandName: '',
    genericName: '',
    activeIngredient: '',
    strength: '',
    dosageForm: 'Tablet',
    manufacturer: '',
    categoryId: '',
    prescriptionRequired: false,
    description: '',
    usageInstructions: '',
    sideEffects: ''
  };
  const [medForm, setMedForm] = useState(initialForm);

  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getMedicines({ search, category_id: selectedCategory, limit: 100 });
      if (res.data.success) {
        setMedicines(res.data.data || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to load medicine catalog.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search, selectedCategory]);

  useEffect(() => {
    async function loadCats() {
      try {
        const res = await medicineService.getCategories();
        if (res.data.success) {
          setCategories(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCats();
  }, []);

  const handleOpenAdd = () => {
    setMedForm(initialForm);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.createMedicine(medForm);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'New medicine added to global catalog.' });
        setIsAddModalOpen(false);
        fetchMedicines();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to add medicine.' });
    }
  };

  const handleOpenEdit = (m) => {
    setActiveMedicine(m);
    setMedForm({
      name: m.name,
      brandName: m.brand_name,
      genericName: m.generic_name,
      activeIngredient: m.active_ingredient,
      strength: m.strength,
      dosageForm: m.dosage_form,
      manufacturer: m.manufacturer,
      categoryId: m.category_id || '',
      prescriptionRequired: !!m.prescription_required,
      description: m.description || '',
      usageInstructions: m.usage_instructions || '',
      sideEffects: m.side_effects || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeMedicine) return;
    try {
      const res = await adminService.updateMedicine(activeMedicine.id, medForm);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Medicine updated successfully.' });
        setIsEditModalOpen(false);
        fetchMedicines();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to update medicine.' });
    }
  };

  const handleDeleteSubmit = async () => {
    if (!activeMedicine) return;
    try {
      const res = await adminService.deleteMedicine(activeMedicine.id);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Medicine removed from catalog.' });
        setIsDeleteModalOpen(false);
        fetchMedicines();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to delete medicine.' });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
            Global Medicine Catalog
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '4px' }}>
            Maintain national pharmaceutical formulations, active ingredients, and therapeutic classifications.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add New Medicine</span>
        </button>
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
              placeholder="Search by brand name, generic formulation, active ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Health Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading medicine catalog...
          </div>
        ) : medicines.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Pill size={48} className="text-light" style={{ margin: '0 auto 16px auto' }} />
            <h3>No Medicines Found</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>No records match your query.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Brand Name</th>
                  <th>Generic Formulation</th>
                  <th>Active Ingredient</th>
                  <th>Strength & Form</th>
                  <th>Category</th>
                  <th>Manufacturer</th>
                  <th>Pharmacies Stocking</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="med-cell">
                        <strong>{m.brand_name}</strong>
                        {m.prescription_required ? (
                          <span className="badge badge-warning" style={{ alignSelf: 'flex-start', marginTop: '2px', fontSize: '0.68rem' }}>
                            Rx Required
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{m.generic_name}</td>
                    <td>
                      <span style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                        {m.active_ingredient}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{m.strength}</span>{' '}
                      <span className="badge badge-neutral">{m.dosage_form}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.84rem' }}>{m.category_name || 'General'}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {m.manufacturer}
                    </td>
                    <td>
                      <strong>{m.pharmacies_stocking_count || 0}</strong> chemists
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Medicine"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => { setActiveMedicine(m); setIsDeleteModalOpen(true); }}
                          title="Delete Medicine"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
        title={isAddModalOpen ? 'Add New Medicine to Catalog' : `Edit: ${activeMedicine?.brand_name}`}
        maxWidth="680px"
      >
        <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit}>
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Brand Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dolo 650"
                value={medForm.brandName}
                onChange={(e) => setMedForm({ ...medForm, brandName: e.target.value, name: `${e.target.value} Tablet` })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Paracetamol"
                value={medForm.genericName}
                onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Active Pharmaceutical Ingredient</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Paracetamol"
                value={medForm.activeIngredient}
                onChange={(e) => setMedForm({ ...medForm, activeIngredient: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturer</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Micro Labs Ltd"
                value={medForm.manufacturer}
                onChange={(e) => setMedForm({ ...medForm, manufacturer: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-3col">
            <div className="form-group">
              <label className="form-label">Strength</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 650mg"
                value={medForm.strength}
                onChange={(e) => setMedForm({ ...medForm, strength: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dosage Form</label>
              <select
                className="form-select"
                value={medForm.dosageForm}
                onChange={(e) => setMedForm({ ...medForm, dosageForm: e.target.value })}
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Cream">Cream</option>
                <option value="Injection">Injection</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={medForm.categoryId}
                onChange={(e) => setMedForm({ ...medForm, categoryId: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: '10px 0 16px 0' }}>
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={medForm.prescriptionRequired}
                onChange={(e) => setMedForm({ ...medForm, prescriptionRequired: e.target.checked })}
              />
              <span className="toggle-switch"></span>
              <span className="toggle-label">Prescription Required (Schedule H / Rx)</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Description & Indications</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Clinical indication details..."
              value={medForm.description}
              onChange={(e) => setMedForm({ ...medForm, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Usage Instructions</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Administration guidelines..."
              value={medForm.usageInstructions}
              onChange={(e) => setMedForm({ ...medForm, usageInstructions: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isAddModalOpen ? 'Save Medicine' : 'Update Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Medicine from Catalog"
      >
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          Are you sure you want to permanently delete <strong>{activeMedicine?.brand_name}</strong> from the global database? This will also remove any corresponding pharmacy inventory records.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDeleteSubmit}>
            Confirm Deletion
          </button>
        </div>
      </Modal>
    </div>
  );
}

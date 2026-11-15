import React from 'react';
import { Filter, RotateCcw, Check } from 'lucide-react';
import './FilterPanel.css';

export default function FilterPanel({
  categories = [],
  selectedCategory,
  onSelectCategory,
  selectedDosageForm,
  onSelectDosageForm,
  inStockOnly,
  onToggleInStockOnly,
  sortBy,
  onChangeSortBy,
  onReset
}) {
  const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Inhaler', 'Cream'];

  return (
    <div className="card filter-panel">
      <div className="filter-header">
        <div className="filter-title">
          <Filter size={18} className="text-primary" />
          <span>Filter & Refine</span>
        </div>
        <button className="btn-reset-filters" onClick={onReset} title="Reset all filters">
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By */}
      <div className="filter-section">
        <label className="filter-label">Sort Medicines</label>
        <select
          className="form-select filter-select"
          value={sortBy}
          onChange={(e) => onChangeSortBy(e.target.value)}
        >
          <option value="relevance">Most Available (Recommended)</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </div>

      {/* In Stock Toggle */}
      <div className="filter-section">
        <label className="toggle-container">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStockOnly(e.target.checked)}
          />
          <span className="toggle-switch"></span>
          <span className="toggle-label">In Stock Nearby Only</span>
        </label>
      </div>

      {/* Categories */}
      <div className="filter-section">
        <label className="filter-label">Health Categories</label>
        <div className="category-filter-list">
          <button
            className={`category-filter-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => onSelectCategory('')}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-filter-item ${selectedCategory === cat.slug || selectedCategory === String(cat.id) ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.slug)}
            >
              <span>{cat.name}</span>
              {cat.medicine_count !== undefined && (
                <span className="filter-count">{cat.medicine_count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dosage Form */}
      <div className="filter-section">
        <label className="filter-label">Dosage Form</label>
        <div className="dosage-chips">
          <button
            className={`chip-item ${!selectedDosageForm ? 'active' : ''}`}
            onClick={() => onSelectDosageForm('')}
          >
            All
          </button>
          {dosageForms.map((df) => (
            <button
              key={df}
              className={`chip-item ${selectedDosageForm === df ? 'active' : ''}`}
              onClick={() => onSelectDosageForm(df)}
            >
              {df}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

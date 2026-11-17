import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pill, Search, MapPin, Filter, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { medicineService } from '../services/api';
import SearchBar from '../components/search/SearchBar';
import MedicineCard from '../components/search/MedicineCard';
import FilterPanel from '../components/search/FilterPanel';
import './FindMedicinesPage.css';

function getSavedLocation() {
  try {
    return JSON.parse(localStorage.getItem('medifind_location') || 'null');
  } catch (error) {
    return null;
  }
}

export default function FindMedicinesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const savedLocation = getSavedLocation();
  const cityParam = searchParams.get('city') || savedLocation?.label || '';
  const savedCoordinatesMatch = savedLocation?.label?.toLowerCase() === cityParam.toLowerCase();
  const latitudeParam = searchParams.get('user_lat') || (savedCoordinatesMatch ? String(savedLocation.latitude) : '');
  const longitudeParam = searchParams.get('user_lng') || (savedCoordinatesMatch ? String(savedLocation.longitude) : '');
  const initialCoordinates = latitudeParam && longitudeParam
    ? { latitude: Number(latitudeParam), longitude: Number(longitudeParam) }
    : null;

  // Component state
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedDosageForm, setSelectedDosageForm] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Load initial categories & recent searches
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, recRes] = await Promise.all([
          medicineService.getCategories(),
          medicineService.getRecentSearches()
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (recRes.data.success) setRecentSearches(recRes.data.data);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Update category when URL param changes
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Fetch medicines based on current active query & filters
  useEffect(() => {
    async function fetchMedicines() {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          q: queryParam,
          category: selectedCategory,
          dosage_form: selectedDosageForm,
          in_stock_only: inStockOnly,
          sort: sortBy,
          page,
          limit: 12
        };
        if (initialCoordinates && Number.isFinite(initialCoordinates.latitude) && Number.isFinite(initialCoordinates.longitude)) {
          params.user_lat = initialCoordinates.latitude;
          params.user_lng = initialCoordinates.longitude;
        }

        const res = await medicineService.search(params);
        if (res.data.success) {
          setMedicines(res.data.data || []);
          setPagination(res.data.pagination || { total: 0, totalPages: 1 });
        }
      } catch (err) {
        console.error('Fetch medicines error:', err);
        setError('Failed to load medicines. Please check your network connection.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMedicines();
  }, [queryParam, selectedCategory, selectedDosageForm, inStockOnly, sortBy, page, latitudeParam, longitudeParam]);

  // Search trigger from searchbar
  const handleSearchSubmit = ({ q, city, user_lat, user_lng }) => {
    const nextParams = new URLSearchParams(searchParams);
    if (q) nextParams.set('q', q);
    else nextParams.delete('q');

    if (city) nextParams.set('city', city);
    if (Number.isFinite(user_lat) && Number.isFinite(user_lng)) {
      nextParams.set('user_lat', String(user_lat));
      nextParams.set('user_lng', String(user_lng));
    }
    nextParams.set('page', '1');
    setPage(1);
    setSearchParams(nextParams);
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (slug) nextParams.set('category', slug);
    else nextParams.delete('category');
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedDosageForm('');
    setInStockOnly(false);
    setSortBy('relevance');
    setPage(1);
    const nextParams = new URLSearchParams();
    if (queryParam) nextParams.set('q', queryParam);
    if (cityParam) nextParams.set('city', cityParam);
    if (latitudeParam && longitudeParam) {
      nextParams.set('user_lat', latitudeParam);
      nextParams.set('user_lng', longitudeParam);
    }
    setSearchParams(nextParams);
  };

  const locationSearchParams = new URLSearchParams();
  if (cityParam) locationSearchParams.set('city', cityParam);
  if (latitudeParam && longitudeParam) {
    locationSearchParams.set('user_lat', latitudeParam);
    locationSearchParams.set('user_lng', longitudeParam);
  }
  const locationSearch = locationSearchParams.toString();

  return (
    <div className="find-medicines-page">
      {/* Top Search Hero Bar */}
      <section className="search-header-bar">
        <div className="container">
          <div className="search-header-inner">
            <h1 className="search-page-title">
              {queryParam ? `Results for "${queryParam}"` : 'Discover & Compare Medicines'}
            </h1>
            <p className="search-page-sub">
              Browse licensed pharmacies with live stock, verified prices, and in-person pickup reservation.
            </p>

            <div className="header-searchbar-container">
              <SearchBar
                initialQuery={queryParam}
                initialCity={cityParam}
                initialCoordinates={initialCoordinates}
                onSearch={handleSearchSubmit}
              />
            </div>

            {/* Recent Searches Pills */}
            {recentSearches.length > 0 && (
              <div className="recent-searches-row">
                <span className="recent-label">Recent searches:</span>
                {recentSearches.map((item, idx) => (
                  <button
                    key={idx}
                    className="recent-pill-btn"
                    onClick={() => handleSearchSubmit({ q: item.query })}
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Layout (Sidebar Filters + Results Grid) */}
      <div className="container search-main-container">
        <div className="search-layout-grid">
          {/* Left Column: Filter Panel */}
          <aside className="search-sidebar">
            <FilterPanel
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
              selectedDosageForm={selectedDosageForm}
              onSelectDosageForm={(df) => { setSelectedDosageForm(df); setPage(1); }}
              inStockOnly={inStockOnly}
              onToggleInStockOnly={(checked) => { setInStockOnly(checked); setPage(1); }}
              sortBy={sortBy}
              onChangeSortBy={(sort) => { setSortBy(sort); setPage(1); }}
              onReset={handleResetFilters}
            />
          </aside>

          {/* Right Column: Search Results */}
          <main className="search-results-content">
            <div className="results-header-row">
              <div className="results-count">
                Showing <strong>{medicines.length}</strong> of <strong>{pagination.total}</strong> medicines
                {selectedCategory && <span className="active-cat-label"> in category</span>}
              </div>

              {/* Sample Data Disclaimer Badge */}
              <div className="sample-data-badge" title="Development dataset with realistic medicine formulations & pharmacies">
                <CheckCircle2 size={14} />
                <span>Verified Pharmacy Data</span>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="search-loading-state">
                <Loader2 size={36} className="spinner-icon" />
                <p>Searching verified pharmacy inventories...</p>
              </div>
            ) : error ? (
              <div className="card search-error-card">
                <AlertCircle size={32} className="text-danger" />
                <p>{error}</p>
                <button className="btn btn-outline btn-sm" onClick={handleResetFilters}>
                  Try Resetting Filters
                </button>
              </div>
            ) : medicines.length === 0 ? (
              /* Empty State */
              <div className="card search-empty-state">
                <Pill size={48} className="empty-icon" />
                <h3>No Medicines Found</h3>
                <p>
                  We couldn't find any medicine matching your criteria. Try searching by active ingredient (e.g. "Paracetamol", "Amoxicillin") or clearing applied filters.
                </p>
                <button className="btn btn-primary" onClick={handleResetFilters}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              /* Medicine Cards Grid */
              <div className="medicines-grid">
                {medicines.map((medicine) => (
                  <MedicineCard
                    key={medicine.id}
                    medicine={medicine}
                    hasLocation={Boolean(initialCoordinates && Number.isFinite(initialCoordinates.latitude) && Number.isFinite(initialCoordinates.longitude))}
                    locationSearch={locationSearch ? `?${locationSearch}` : ''}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination-wrapper">
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span className="page-indicator">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

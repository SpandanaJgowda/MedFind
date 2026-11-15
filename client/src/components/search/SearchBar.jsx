import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Pill, Crosshair, ArrowRight, Loader2 } from 'lucide-react';
import { medicineService } from '../../services/api';
import './SearchBar.css';

const LOCATION_PREFERENCE_KEY = 'medifind_location';
const DEFAULT_LOCATION = { label: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 };

function readLocationPreference() {
  try {
    return JSON.parse(localStorage.getItem(LOCATION_PREFERENCE_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

export default function SearchBar({
  initialQuery = '',
  initialCity = '',
  initialCoordinates = null,
  onSearch,
  placeholder = 'Search by medicine brand, generic name, active ingredient...'
}) {
  const navigate = useNavigate();
  const savedLocation = readLocationPreference();
  const startingCity = initialCity || savedLocation?.label || DEFAULT_LOCATION.label;
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(startingCity);
  const [coordinates, setCoordinates] = useState(() => {
    if (initialCoordinates && Number.isFinite(initialCoordinates.latitude) && Number.isFinite(initialCoordinates.longitude)) {
      return { ...initialCoordinates, label: startingCity };
    }
    if (
      savedLocation?.label?.toLowerCase() === startingCity.toLowerCase() &&
      Number.isFinite(savedLocation.latitude) &&
      Number.isFinite(savedLocation.longitude)
    ) return savedLocation;
    if (startingCity.toLowerCase() === DEFAULT_LOCATION.label.toLowerCase()) return DEFAULT_LOCATION;
    return null;
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  // Debounced autocomplete suggestions
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const res = await medicineService.getSuggestions(query.trim());
        if (res.data.success) {
          setSuggestions(res.data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        // Silently catch suggestion errors
      } finally {
        setIsSuggesting(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resolveLocation = async (locationName) => {
    const saved = readLocationPreference();
    if (saved?.label?.toLowerCase() === locationName.toLowerCase() && Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude)) {
      return saved;
    }

    const params = new URLSearchParams({ format: 'jsonv2', countrycodes: 'in', limit: '1' });
    if (/^\d{6}$/.test(locationName)) {
      params.set('postalcode', locationName);
      params.set('country', 'India');
    } else {
      params.set('q', locationName);
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    if (!response.ok) throw new Error('Location search is temporarily unavailable.');
    const matches = await response.json();
    if (!matches.length) throw new Error('No matching Indian location found. Try a city, area, landmark or PIN code.');

    const result = {
      label: locationName,
      latitude: Number(matches[0].lat),
      longitude: Number(matches[0].lon)
    };
    if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
      throw new Error('Could not determine coordinates for that location.');
    }
    return result;
  };

  const dispatchSearch = (searchQuery, locationName, selectedCoordinates, medicineId = null, rememberLocation = true) => {
    const locationParams = new URLSearchParams({
      city: locationName,
      user_lat: String(selectedCoordinates.latitude),
      user_lng: String(selectedCoordinates.longitude)
    });

    if (rememberLocation) {
      localStorage.setItem(LOCATION_PREFERENCE_KEY, JSON.stringify({
        label: locationName,
        latitude: selectedCoordinates.latitude,
        longitude: selectedCoordinates.longitude
      }));
    }

    if (medicineId) {
      navigate(`/medicines/${medicineId}?${locationParams}`);
    } else if (onSearch) {
      onSearch({
        q: searchQuery.trim(),
        city: locationName,
        user_lat: selectedCoordinates.latitude,
        user_lng: selectedCoordinates.longitude
      });
    } else {
      locationParams.set('q', searchQuery.trim());
      navigate(`/medicines?${locationParams}`);
    }
  };

  const searchAtEnteredLocation = async (searchQuery, medicineId = null) => {
    const locationName = city.trim();
    if (!locationName) {
      setLocationError('Enter an Indian city, area, landmark or PIN code.');
      return;
    }

    setLocationError('');
    setIsLocating(true);
    try {
      const coordinatesAreCurrent =
        coordinates?.label?.toLowerCase() === locationName.toLowerCase() &&
        Number.isFinite(coordinates.latitude) &&
        Number.isFinite(coordinates.longitude);
      const selectedCoordinates = coordinatesAreCurrent
        ? coordinates
        : await resolveLocation(locationName);
      setCoordinates(selectedCoordinates);
      dispatchSearch(searchQuery, locationName, selectedCoordinates, medicineId);
    } catch (error) {
      setLocationError(error.message || 'Could not find that location in India.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    searchAtEnteredLocation(query);
  };

  const handleSelectSuggestion = (sug) => {
    const nextQuery = sug.generic || sug.title;
    setQuery(nextQuery);
    setShowSuggestions(false);
    searchAtEnteredLocation(nextQuery, sug.id || null);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Current location is not available in this browser.');
      return;
    }

    setLocationError('');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        let label = 'Current location';

        try {
          const reverseParams = new URLSearchParams({
            format: 'jsonv2',
            lat: String(latitude),
            lon: String(longitude),
            addressdetails: '1'
          });
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${reverseParams}`);
          if (response.ok) {
            const result = await response.json();
            const address = result.address || {};
            const locality = address.village || address.hamlet || address.suburb || address.neighbourhood || address.town || address.city;
            const district = address.county || address.city_district || address.state_district;
            label = [...new Set([locality, district, address.state].filter(Boolean))].join(', ') || label;
          }
        } catch (error) {
          // Coordinates remain usable if reverse geocoding is unavailable.
        }

        const selectedCoordinates = { label, latitude, longitude };
        setCity(label);
        setCoordinates(selectedCoordinates);
        dispatchSearch(query, label, selectedCoordinates, null, false);
        setIsLocating(false);
      },
      () => {
        setLocationError('Location permission was denied or could not be determined.');
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="search-bar-wrapper" ref={dropdownRef}>
      <form className="search-bar-form" onSubmit={handleSubmit}>
        {/* Medicine Input */}
        <div className="search-input-field medicine-field">
          <Search size={20} className="field-icon search-icon" />
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            placeholder={placeholder}
          />
          {isSuggesting && <Loader2 size={16} className="spinner-icon field-action" />}
        </div>

        {/* Location Input */}
        <div className="search-input-field location-field">
          <button
            type="button"
            className="location-picker-trigger"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            title="Use my live location"
            aria-label="Use my live location"
          >
            <MapPin size={18} className="field-icon location-icon" />
          </button>
          <input
            type="text"
            className="search-input location-input"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setCoordinates(null);
              setLocationError('');
            }}
            placeholder="City, area, landmark or PIN code in India"
          />
          <button
            type="button"
            className="btn-locate"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            title="Use Current GPS Location"
          >
            {isLocating ? <Loader2 size={16} className="spinner-icon" /> : <Crosshair size={16} />}
          </button>
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary search-submit-btn" disabled={isLocating}>
          <span>{isLocating ? 'Finding location...' : 'Search'}</span>
          {isLocating ? <Loader2 size={18} className="spinner-icon" /> : <ArrowRight size={18} />}
        </button>
      </form>

      {locationError && <p className="location-search-error" role="alert">{locationError}</p>}

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          <div className="suggestions-header">Matching Medicines & Active Ingredients</div>
          {suggestions.map((sug, idx) => (
            <div
              key={idx}
              className="suggestion-row"
              onClick={() => handleSelectSuggestion(sug)}
            >
              <div className="sug-icon">
                <Pill size={16} />
              </div>
              <div className="sug-info">
                <div className="sug-title">
                  <strong>{sug.title}</strong>
                  <span className="sug-dosage-tag">{sug.dosageForm}</span>
                </div>
                <div className="sug-meta">
                  <span>Ingredient: {sug.activeIngredient}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

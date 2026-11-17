export async function geocodeIndianAddress({ address, city, state, pincode }) {
  const query = [address, city, state, pincode, 'India'].filter(Boolean).join(', ');
  const params = new URLSearchParams({
    format: 'jsonv2',
    countrycodes: 'in',
    addressdetails: '1',
    limit: '1',
    q: query
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!response.ok) throw new Error('Could not resolve the store address. Please try again.');

  const matches = await response.json();
  const latitude = Number(matches[0]?.lat);
  const longitude = Number(matches[0]?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Could not find that store address in India. Check the address, city, state and PIN code.');
  }

  return { latitude, longitude };
}
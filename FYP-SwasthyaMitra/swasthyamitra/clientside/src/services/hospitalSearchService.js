/**
 * Client-side hospital search using Fuse.js.
 * Loads nepal_health_facilities_clean.json from public folder - no backend load.
 */

import Fuse from 'fuse.js';

const HOSPITAL_JSON_URL = '/data/nepal_health_facilities_clean.json';
const MAX_RESULTS = 10;

let cachedData = null;
let fuseInstance = null;

/**
 * Load and cache hospital data, build Fuse index.
 * @returns {Promise<Array>} List of hospitals with id (index)
 */
export async function loadHospitalData() {
  if (cachedData) return cachedData;
  const res = await fetch(HOSPITAL_JSON_URL);
  if (!res.ok) throw new Error('Failed to load hospital data');
  const raw = await res.json();
  cachedData = raw.map((h, i) => ({ ...h, id: String(i) }));
  fuseInstance = new Fuse(cachedData, {
    keys: ['name', 'province', 'district', 'address', 'hospital_type'],
    threshold: 0.4,
    includeScore: true,
  });
  return cachedData;
}

/**
 * Search hospitals by query (client-side, no backend).
 * @param {string} q - Search query
 * @returns {Promise<Array>} Results with type: 'hospital'
 */
export async function searchHospitals(q) {
  const trimmed = (q || '').trim();
  if (trimmed.length < 2) return [];

  try {
    await loadHospitalData();
    const results = fuseInstance.search(trimmed).slice(0, MAX_RESULTS);
    return results.map((r) => ({
      type: 'hospital',
      ...r.item,
    }));
  } catch (err) {
    console.error('Hospital search error:', err);
    return [];
  }
}

/**
 * Ensure hospital data is loaded (for preloading).
 */
export async function preloadHospitalData() {
  return loadHospitalData();
}

export default { searchHospitals, preloadHospitalData, loadHospitalData };

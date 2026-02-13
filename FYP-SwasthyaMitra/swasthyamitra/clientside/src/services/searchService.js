/**
 * Search API service (web script) for doctor/hospital/symptom search.
 * - Aborts previous request when a new one is made (faster UX).
 * - Optional timeout to avoid hanging.
 */

const SEARCH_TIMEOUT_MS = 8000;

/**
 * Fetch search results from the backend (unified search: diseases, doctors, locations across Nepal).
 * @param {string} baseUrl - API base URL (e.g. from AppContext backendUrl)
 * @param {object} opts - { type: 'all', q: string, signal?: AbortSignal, timeoutMs?: number }
 * @returns {Promise<{ results: Array }>}
 */
export async function searchDoctors(baseUrl, { type = 'all', q = '', signal, timeoutMs = SEARCH_TIMEOUT_MS }) {
  const params = new URLSearchParams({ type: 'all', q: q.trim() });
  const url = `${baseUrl.replace(/\/$/, '')}/api/search?${params}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const finalSignal = signal || controller.signal;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: finalSignal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    return { results: data.results || [], suggested: data.suggested === true };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return { results: [], aborted: true };
    throw err;
  }
}

export default { searchDoctors };

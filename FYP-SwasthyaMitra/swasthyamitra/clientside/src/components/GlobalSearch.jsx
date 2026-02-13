import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { searchDoctors } from '../services/searchService';
import { searchHospitals } from '../services/hospitalSearchService';

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

const GlobalSearch = () => {
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hospitalResults, setHospitalResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setHospitalResults([]);
      setLoading(false);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    // Run doctor+web search (backend) and hospital search (client-side) in parallel
    const [doctorResp, hospitals] = await Promise.all([
      backendUrl
        ? searchDoctors(backendUrl, { type: 'all', q, signal: controller.signal, timeoutMs: 8000 }).catch(() => ({ results: [] }))
        : Promise.resolve({ results: [] }),
      searchHospitals(q),
    ]);

    if (controller.signal.aborted) return;
    setResults(doctorResp?.results || []);
    setHospitalResults(hospitals || []);
    abortRef.current = abortRef.current === controller ? null : abortRef.current;
    setLoading(false);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setResults([]);
      setHospitalResults([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(runSearch, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= MIN_QUERY_LENGTH) {
      // Navigate to in-app search results page
      navigate(`/search?q=${encodeURIComponent(q)}`);
      closeResults();
    }
  };

  const showDropdown = focused && query.trim().length >= MIN_QUERY_LENGTH;

  const openDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setFocused(true);
  };

  const closeDropdown = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setFocused(false);
    }, 150);
  };

  const closeResults = () => {
    setQuery('');
    setResults([]);
    setHospitalResults([]);
    setFocused(false);
  };

  const doctors = (results || []).filter((r) => r.type === 'doctor');
  const webResults = (results || []).filter((r) => r.type === 'web');
  const hospitals = hospitalResults || [];
  const hasResults = doctors.length > 0 || hospitals.length > 0 || webResults.length > 0;

  const handleGoogleSearch = () => {
    if (query.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank', 'noopener,noreferrer');
      closeResults();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto" ref={containerRef}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 text-center sm:text-left">
        Search doctors, hospitals & the web
      </p>
      <form
        onSubmit={handleSubmit}
        className={`
          relative flex items-center gap-0
          bg-white rounded-2xl border border-slate-200/80 overflow-visible
          shadow-lg shadow-slate-200/50
          transition-all duration-200 ease-out
          ${focused ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-white shadow-xl shadow-slate-200/60' : 'hover:shadow-xl hover:shadow-slate-200/40'}
        `}
      >
        <div className="relative flex-1 min-w-0 flex items-center">
          <span
            className={`absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${focused ? 'text-primary' : 'text-slate-400'}`}
            aria-hidden="true"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={openDropdown}
            onBlur={closeDropdown}
            placeholder="Search doctors, hospitals & the web..."
            className="w-full h-14 pl-12 pr-4 min-w-0 bg-transparent text-slate-800 placeholder-slate-400 text-base outline-none font-normal rounded-2xl"
            aria-label="Search Google"
            autoComplete="off"
          />
        </div>

        {showDropdown && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-[80] bg-white rounded-xl border border-slate-200 shadow-xl max-h-[70vh] overflow-hidden flex flex-col"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/80">
              <span className="text-sm font-medium text-slate-600">
                {loading ? 'Searching…' : hasResults
                  ? [doctors.length > 0 && `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''}`, hospitals.length > 0 && `${hospitals.length} hospital${hospitals.length !== 1 ? 's' : ''}`, webResults.length > 0 && `${webResults.length} web result${webResults.length !== 1 ? 's' : ''}`].filter(Boolean).join(', ')
                  : 'No results — try Search'}
              </span>
              <button
                type="button"
                onClick={closeResults}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 py-2">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-slate-500">
                  <span className="animate-pulse text-sm">Searching…</span>
                </div>
              ) : hasResults ? (
                <ul className="divide-y divide-slate-100">
                  {doctors.map((item) => (
                    <li key={`doctor-${item._id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (item._id) navigate(`/appointment/${item._id}`);
                          closeResults();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-lg"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-100">
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.speciality}</p>
                          {item.address?.line1 && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {item.address.line1}
                              {item.address.line2 ? `, ${item.address.line2}` : ''}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-primary shrink-0">Book →</span>
                      </button>
                    </li>
                  ))}
                  {hospitals.map((item) => (
                    <li key={`hospital-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/hospital/${item.id}`, { state: { hospital: item } });
                          closeResults();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-lg"
                      >
                        <div className="w-12 h-12 rounded-xl shrink-0 bg-emerald-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-600">
                            {[item.district, item.province].filter(Boolean).join(', ') || item.hospital_type || 'Health facility'}
                          </p>
                          {item.address && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.address}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-emerald-600 shrink-0">View →</span>
                      </button>
                    </li>
                  ))}
                  {webResults.slice(0, 5).map((item, idx) => (
                    <li key={`web-${idx}`}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-lg"
                      >
                        <p className="text-xs text-slate-500 truncate">{item.displayLink || item.link}</p>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        {item.snippet && (
                          <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{item.snippet}</p>
                        )}
                      </a>
                    </li>
                  ))}
                  <li className="border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                        closeResults();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-primary">View all results</p>
                        <p className="text-sm text-slate-600">See full doctors, hospitals & web results for &quot;{query.trim().slice(0, 25)}{query.trim().length > 25 ? '...' : ''}&quot;</p>
                      </div>
                      <span className="text-sm font-medium text-primary shrink-0">→</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleGoogleSearch}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-blue-700">Also search on Google</p>
                        <p className="text-sm text-slate-600">Open in new tab</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600 shrink-0">↗</span>
                    </button>
                  </li>
                </ul>
              ) : (
                <ul className="divide-y divide-slate-100">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                        closeResults();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-primary/5 transition-colors rounded-lg"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-primary text-lg">View search results</p>
                        <p className="text-sm text-slate-600">See results for &quot;{query.trim().slice(0, 30)}{query.trim().length > 30 ? '...' : ''}&quot;</p>
                      </div>
                      <span className="text-sm font-medium text-primary shrink-0 mt-2">→</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleGoogleSearch}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-blue-700">Also search on Google</p>
                        <p className="text-sm text-slate-600">Open in new tab</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600 shrink-0">↗</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default GlobalSearch;

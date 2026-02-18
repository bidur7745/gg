import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

const GlobalSearch = () => {
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setDoctors([]);
      setHospitals([]);
      setLoading(false);
      return;
    }
    
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/search`,
        {
          params: { q },
          signal: controller.signal,
        }
      );

      if (controller.signal.aborted) return;

      if (data.success) {
        setDoctors(data.doctors || []);
        setHospitals(data.hospitals || []);
      } else {
        setDoctors([]);
        setHospitals([]);
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Search error:', error);
        console.error('Backend URL:', backendUrl);
        console.error('Search query:', q);
        console.error('Error details:', error.response?.data || error.message);
        setDoctors([]);
        setHospitals([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        abortRef.current = abortRef.current === controller ? null : abortRef.current;
      }
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setDoctors([]);
      setHospitals([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(runSearch, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, backendUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= MIN_QUERY_LENGTH) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      closeResults();
    }
  };

  const showDropdown = focused && query.trim().length >= MIN_QUERY_LENGTH;
  const hasResults = doctors.length > 0 || hospitals.length > 0;

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
    setDoctors([]);
    setHospitals([]);
    setFocused(false);
  };

  const handleDoctorClick = (doctorId) => {
    navigate(`/appointment/${doctorId}`);
    closeResults();
  };

  const handleHospitalClick = (hospitalId) => {
    navigate(`/hospital/${hospitalId}`);
    closeResults();
  };

  return (
    <div className="w-full max-w-4xl mx-auto" ref={containerRef}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 text-center sm:text-left">
        Search doctors & hospitals
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
            placeholder="Search doctors or hospitals..."
            className="w-full h-14 pl-12 pr-4 min-w-0 bg-transparent text-slate-800 placeholder-slate-400 text-base outline-none font-normal rounded-2xl"
            aria-label="Search doctors and hospitals"
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
                  ? [
                      doctors.length > 0 && `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''}`,
                      hospitals.length > 0 && `${hospitals.length} hospital${hospitals.length !== 1 ? 's' : ''}`,
                    ].filter(Boolean).join(', ')
                  : 'No results found'}
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
                  {/* Doctors */}
                  {doctors.map((doctor) => (
                    <li key={`doctor-${doctor._id}`}>
                      <button
                        type="button"
                        onClick={() => handleDoctorClick(doctor._id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-lg"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-100">
                          <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{doctor.name}</p>
                          <p className="text-sm text-slate-600">{doctor.speciality}</p>
                          {doctor.address?.line1 && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {doctor.address.line1}
                              {doctor.address.line2 ? `, ${doctor.address.line2}` : ''}
                            </p>
                          )}
                          {doctor.hospitals && doctor.hospitals.length > 0 && (
                            <p className="text-xs text-primary mt-1">
                              {doctor.hospitals.length} hospital{doctor.hospitals.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-primary shrink-0">Book →</span>
                      </button>
                    </li>
                  ))}
                  
                  {/* Hospitals */}
                  {hospitals.map((hospital) => (
                    <li key={`hospital-${hospital._id}`}>
                      <button
                        type="button"
                        onClick={() => handleHospitalClick(hospital._id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-lg"
                      >
                        <div className="w-12 h-12 rounded-xl shrink-0 bg-emerald-100 flex items-center justify-center overflow-hidden">
                          {hospital.image ? (
                            <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{hospital.name}</p>
                          <p className="text-sm text-slate-600">
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium mr-2">
                              {hospital.type}
                            </span>
                          </p>
                          {hospital.address?.line1 && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {hospital.address.line1}
                              {hospital.address.line2 ? `, ${hospital.address.line2}` : ''}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-emerald-600 shrink-0">View →</span>
                      </button>
                    </li>
                  ))}
                  
                  {/* View All Results */}
                  {hasResults && (
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
                          <p className="text-sm text-slate-600">See all doctors & hospitals for &quot;{query.trim().slice(0, 25)}{query.trim().length > 25 ? '...' : ''}&quot;</p>
                        </div>
                        <span className="text-sm font-medium text-primary shrink-0">→</span>
                      </button>
                    </li>
                  )}
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

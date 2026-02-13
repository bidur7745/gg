import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { searchDoctors } from '../services/searchService';
import { searchHospitals } from '../services/hospitalSearchService';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [hospitalResults, setHospitalResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setLoading(false);
      setResults([]);
      setHospitalResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      backendUrl ? searchDoctors(backendUrl, { type: 'all', q }) : Promise.resolve({ results: [] }),
      searchHospitals(q),
    ])
      .then(([doctorResp, hospitals]) => {
        setResults(doctorResp?.results || []);
        setHospitalResults(hospitals || []);
      })
      .catch((err) => {
        setError(err.message || 'Search failed');
        setResults([]);
        setHospitalResults([]);
      })
      .finally(() => setLoading(false));
  }, [query, backendUrl]);

  const doctors = (results || []).filter((r) => r.type === 'doctor');
  const webResults = (results || []).filter((r) => r.type === 'web');
  const hospitals = hospitalResults || [];

  return (
    <div className="min-h-[60vh] pb-12">
      {!query.trim() ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">Enter a search above to find doctors, hospitals and web results.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-16">
          <span className="animate-pulse text-slate-600">Searching…</span>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Doctors section */}
          {doctors.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Doctors ({doctors.length})
              </h2>
              <ul className="space-y-3">
                {doctors.map((item) => (
                  <li
                    key={`doctor-${item._id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-slate-100">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">{item.speciality}</p>
                      {item.address?.line1 && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.address.line1}
                          {item.address.line2 ? `, ${item.address.line2}` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/appointment/${item._id}`)}
                      className="shrink-0 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                    >
                      Book
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Hospitals section */}
          {hospitals.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Hospitals & Health Facilities ({hospitals.length})
              </h2>
              <ul className="space-y-3">
                {hospitals.map((item) => (
                  <li
                    key={`hospital-${item.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all"
                  >
                    <div className="w-14 h-14 rounded-xl shrink-0 bg-emerald-100 flex items-center justify-center">
                      <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">
                        {[item.district, item.province].filter(Boolean).join(', ') || item.hospital_type || 'Health facility'}
                      </p>
                      {item.address && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.address}</p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/hospital/${item.id}`, { state: { hospital: item } })}
                      className="shrink-0 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Web results section */}
          {webResults.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Web results ({webResults.length})
              </h2>
              <ul className="space-y-3">
                {webResults.map((item, idx) => (
                  <li
                    key={`web-${idx}`}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <p className="text-sm text-slate-500 mb-1 truncate">{item.displayLink || item.link}</p>
                      <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      {item.snippet && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.snippet}</p>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {doctors.length === 0 && hospitals.length === 0 && webResults.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg">No results found for &quot;{query}&quot;.</p>
              <p className="text-sm mt-2">Try a different search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;

import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setLoading(false);
      setDoctors([]);
      setHospitals([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    axios
      .get(`${backendUrl}/api/search`, { params: { q } })
      .then(({ data }) => {
        if (data.success) {
          setDoctors(data.doctors || []);
          setHospitals(data.hospitals || []);
        } else {
          setError(data.message || 'Search failed');
          setDoctors([]);
          setHospitals([]);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        console.error('Backend URL:', backendUrl);
        console.error('Search query:', q);
        console.error('Error details:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || 'Search failed');
        setDoctors([]);
        setHospitals([]);
      })
      .finally(() => setLoading(false));
  }, [query, backendUrl]);

  return (
    <div className="min-h-[60vh] pb-12">
      {!query.trim() ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">Enter a search above to find doctors and hospitals.</p>
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
                {doctors.map((doctor) => (
                  <li
                    key={`doctor-${doctor._id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/appointment/${doctor._id}`)}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-slate-100">
                      <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{doctor.name}</p>
                      <p className="text-sm text-slate-600">{doctor.speciality}</p>
                      {doctor.address?.line1 && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {doctor.address.line1}
                          {doctor.address.line2 ? `, ${doctor.address.line2}` : ''}
                        </p>
                      )}
                      {doctor.hospitals && doctor.hospitals.length > 0 && (
                        <p className="text-xs text-primary mt-1">
                          Available at {doctor.hospitals.length} hospital{doctor.hospitals.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/appointment/${doctor._id}`);
                      }}
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
                Hospitals ({hospitals.length})
              </h2>
              <ul className="space-y-3">
                {hospitals.map((hospital) => (
                  <li
                    key={`hospital-${hospital._id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/hospital/${hospital._id}`)}
                  >
                    <div className="w-14 h-14 rounded-xl shrink-0 bg-emerald-100 flex items-center justify-center overflow-hidden">
                      {hospital.image ? (
                        <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <p className="text-xs text-slate-500 mt-0.5">
                          {hospital.address.line1}
                          {hospital.address.line2 ? `, ${hospital.address.line2}` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/hospital/${hospital._id}`);
                      }}
                      className="shrink-0 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {doctors.length === 0 && hospitals.length === 0 && (
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

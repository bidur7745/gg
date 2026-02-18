import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const HospitalDetail = () => {
  const { id } = useParams();
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospital = async () => {
      if (!backendUrl || !id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data } = await axios.get(`${backendUrl}/api/hospital/${id}`);
        
        if (data.success) {
          setHospital(data.hospital);
          setDoctors(data.doctors || []);
        } else {
          setError(data.message || 'Hospital not found');
        }
      } catch (err) {
        console.error('Error fetching hospital:', err);
        setError(err.response?.data?.message || 'Failed to load hospital');
      } finally {
        setLoading(false);
      }
    };

    fetchHospital();
  }, [id, backendUrl]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">{error || 'Hospital not found.'}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] pb-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Hospital Info */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
              {hospital.image ? (
                <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{hospital.name}</h1>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                {hospital.type}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {hospital.address && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Address</p>
                <p className="text-slate-800 mt-1">
                  {hospital.address.line1}
                  {hospital.address.line2 ? `, ${hospital.address.line2}` : ''}
                </p>
              </div>
            )}
            
            {hospital.phone && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</p>
                <p className="text-slate-800 mt-1">{hospital.phone}</p>
              </div>
            )}
            
            {hospital.email && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</p>
                <p className="text-slate-800 mt-1">{hospital.email}</p>
              </div>
            )}

            {hospital.description && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">About</p>
                <p className="text-slate-700 mt-2 leading-relaxed">{hospital.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctors at this Hospital */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Doctors Available at {hospital.name}
          </h2>
          
          {doctors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No doctors available at this hospital.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/appointment/${doctor._id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-slate-100">
                      <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">{doctor.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{doctor.speciality}</p>
                      <p className="text-xs text-slate-500 mt-1">{doctor.degree}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">
                          {doctor.fees} NPR
                        </span>
                        <button className="text-xs px-3 py-1 bg-primary text-white rounded-full hover:bg-primary/90">
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalDetail;

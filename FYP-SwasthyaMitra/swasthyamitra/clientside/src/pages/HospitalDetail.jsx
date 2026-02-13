import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { loadHospitalData } from '../services/hospitalSearchService';
import axios from 'axios';

const HospitalDetail = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(state?.hospital || null);
  const [loading, setLoading] = useState(!state?.hospital && !!id);
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (state?.hospital) {
      setHospital(state.hospital);
      setLoading(false);
      return;
    }
    if (id) {
      loadHospitalData()
        .then((data) => {
          const found = data.find((h) => String(h.id) === String(id));
          setHospital(found || null);
        })
        .catch(() => setHospital(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, state]);

  useEffect(() => {
    if (!hospital || !backendUrl) return;
    setAiLoading(true);
    setAiError(null);
    axios
      .post(`${backendUrl}/api/hospital/enrich`, {
        name: hospital.name,
        province: hospital.province || null,
        district: hospital.district || null,
        address: hospital.address || null,
        hospital_type: hospital.hospital_type || null,
      })
      .then(({ data }) => {
        if (data.success && data.aiDescription) {
          setAiDescription(data.aiDescription);
        }
      })
      .catch((err) => {
        setAiError(err.response?.data?.message || err.message || 'Could not load description');
      })
      .finally(() => setAiLoading(false));
  }, [hospital, backendUrl]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }
  if (!hospital) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Hospital not found.</p>
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

  const locationParts = [hospital.district, hospital.province].filter(Boolean);

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

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{hospital.name}</h1>
              {hospital.hospital_type && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  {hospital.hospital_type}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {locationParts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Location</p>
                <p className="text-slate-800 mt-1">{locationParts.join(', ')}</p>
              </div>
            )}
            {hospital.address && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Address</p>
                <p className="text-slate-800 mt-1">{hospital.address}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">About</p>
              {aiLoading && (
                <div className="mt-2 flex items-center gap-2 text-slate-500">
                  <span className="animate-pulse">Generating description...</span>
                </div>
              )}
              {aiError && (
                <p className="mt-2 text-amber-600 text-sm">{aiError}</p>
              )}
              {aiDescription && !aiLoading && (
                <p className="mt-2 text-slate-700 leading-relaxed">{aiDescription}</p>
              )}
              {!aiDescription && !aiLoading && !aiError && (
                <p className="mt-2 text-slate-500 text-sm">No additional details available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDetail;

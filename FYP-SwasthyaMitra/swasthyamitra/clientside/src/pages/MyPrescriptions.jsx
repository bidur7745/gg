import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const MyPrescriptions = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [prescriptions, setPrescriptions] = useState([]);

  const getPrescriptions = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/prescriptions", {
        headers: { token },
      });
      if (data.success) {
        setPrescriptions(data.prescriptions || []);
      } else {
        toast.error(data.message || "Could not load prescriptions");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Could not load prescriptions");
    }
  };

  useEffect(() => {
    if (token) getPrescriptions();
  }, [token]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">
        My prescriptions
      </p>
      <p className="text-sm text-zinc-500 mt-1 mb-4">
        Prescriptions issued by doctors after your appointments.
      </p>
      {prescriptions.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-200 rounded-lg">
          <p className="font-medium text-zinc-600">No prescriptions yet</p>
          <p className="text-sm mt-1">
            Prescriptions will appear here after your doctor adds them following an appointment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((item, index) => (
            <div
              key={item._id || index}
              className="border border-zinc-200 rounded-lg p-4 sm:p-5 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 mb-3">
                <div>
                  <p className="font-semibold text-neutral-800">
                    {item.docName || "Doctor"}
                  </p>
                  <p className="text-sm text-primary">
                    {item.docSpeciality || ""}
                  </p>
                </div>
                <p className="text-xs text-zinc-500">
                  {formatDate(item.date)}
                </p>
              </div>
              {item.diagnosis && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Diagnosis
                  </p>
                  <p className="text-zinc-700 mt-0.5">{item.diagnosis}</p>
                </div>
              )}
              {item.medicines && item.medicines.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                    Medicines
                  </p>
                  <ul className="list-none space-y-1">
                    {item.medicines.map((med, i) => (
                      <li
                        key={i}
                        className="text-zinc-700 text-sm flex flex-wrap gap-x-2"
                      >
                        <span className="font-medium">{med.name}</span>
                        {med.dosage && (
                          <span className="text-zinc-500">— {med.dosage}</span>
                        )}
                        {med.duration && (
                          <span className="text-zinc-500">
                            (Duration: {med.duration})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {item.notes && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Notes
                  </p>
                  <p className="text-zinc-600 text-sm mt-0.5">{item.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPrescriptions;

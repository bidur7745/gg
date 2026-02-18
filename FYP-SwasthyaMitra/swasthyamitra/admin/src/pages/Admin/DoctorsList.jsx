import React, { useContext, useEffect } from "react";
import { AdminContext } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";

const DoctorsList = () => {
  const { doctors, aToken, getAllDoctors, changeAvailability, deleteDoctor } =
    useContext(AdminContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);

  return (
    <div className="m-5 max-h-[90vh] overflow-y-scroll w-full">
      <h1 className="text-lg font-medium">All Doctors</h1>
      <div className="w-full flex flex-wrap gap-4 pt-5 gap-y-6">
        {doctors.map((item, index) => (
          <div
            className="border border-primary/30 rounded-xl max-w-56 overflow-hidden cursor-pointer group"
            key={index}
          >
            <img
              className="bg-primary/10 group-hover:bg-primary transition-all duration-500"
              src={item.image}
              alt=""
            />
            <div className="p-4">
              <p className="text-neutral-800 text-lg font-medium">
                {item.name}
              </p>
              <p className="text-zinc-600 text-sm">{item.speciality}</p>
              {item.hospitals && item.hospitals.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.hospitals.slice(0, 2).map((hosp) => {
                    const hospName = typeof hosp === 'object' ? hosp.name : hosp;
                    return (
                      <span
                        key={typeof hosp === 'object' ? hosp._id : hosp}
                        className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        {hospName}
                      </span>
                    );
                  })}
                  {item.hospitals.length > 2 && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{item.hospitals.length - 2} more
                    </span>
                  )}
                </div>
              )}
              <div className="mt-2 flex items-center gap-1 text-sm">
                <input
                  onChange={() => changeAvailability(item._id)}
                  type="checkbox"
                  checked={item.available}
                  className="accent-primary"
                />
                <p>Available</p>
              </div>
              <div className="mt-3 flex gap-2">
                        <button
                  onClick={() => navigate(`/edit-doctor/${item._id}`)}
                  className="flex-1 text-xs px-3 py-1.5 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete Dr. ${item.name}? This action cannot be undone.`)) {
                      deleteDoctor(item._id);
                    }
                  }}
                  className="flex-1 text-xs px-3 py-1.5 border border-red-400 text-red-400 rounded-full hover:bg-red-400 hover:text-white transition-all cursor-pointer font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsList;

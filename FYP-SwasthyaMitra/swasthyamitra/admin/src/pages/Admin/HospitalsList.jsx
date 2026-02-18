import React, { useContext, useEffect } from "react";
import { AdminContext } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";

const HospitalsList = () => {
    const { hospitals, aToken, getAllHospitals, deleteHospital } =
        useContext(AdminContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (aToken) {
            getAllHospitals();
        }
    }, [aToken]);

    return (
        <div className="m-5 max-h-[90vh] overflow-y-scroll w-full">
            <h1 className="text-lg font-medium">All Hospitals</h1>
            <div className="w-full flex flex-wrap gap-4 pt-5 gap-y-6">
                {hospitals.map((item, index) => (
                    <div
                        className="border border-primary/30 rounded-xl max-w-64 overflow-hidden cursor-pointer group"
                        key={index}
                    >
                        <div className="h-40 overflow-hidden bg-primary/10">
                            <img
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                                src={item.image}
                                alt={item.name}
                            />
                        </div>
                        <div className="p-4">
                            <p className="text-neutral-800 text-lg font-medium">
                                {item.name}
                            </p>
                            <p className="text-zinc-500 text-sm mt-0.5">
                                <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                    {item.type}
                                </span>
                            </p>
                            <p className="text-zinc-600 text-sm mt-1 line-clamp-1">
                                {item.address?.line1}
                                {item.address?.line2 ? `, ${item.address.line2}` : ""}
                            </p>
                            <p className="text-zinc-500 text-xs mt-1">{item.phone}</p>

                            <div className="mt-3 flex items-center gap-2">
                                <span
                                    className={`inline-block w-2 h-2 rounded-full ${item.isActive ? "bg-green-500" : "bg-red-400"
                                        }`}
                                ></span>
                                <p className="text-xs text-zinc-500">
                                    {item.isActive ? "Active" : "Inactive"}
                                </p>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => navigate(`/edit-hospital/${item._id}`)}
                                    className="flex-1 text-xs px-3 py-1.5 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to delete ${item.name}? This will remove the hospital from all associated doctors. This action cannot be undone.`)) {
                                            deleteHospital(item._id);
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

export default HospitalsList;

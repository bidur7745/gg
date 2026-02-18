import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const [aToken, setAToken] = useState(
    localStorage.getItem("aToken") ? localStorage.getItem("aToken") : ""
  );
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const getAllDoctors = async () => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/all-doctors",
        {},
        { headers: { aToken } }
      );
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
      return Promise.resolve();
    } catch (error) {
      toast.error(error.message);
      return Promise.reject(error);
    }
  };

  const changeAvailability = async (docId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/change-availability",
        { docId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteDoctor = async (docId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/delete-doctor",
        { docId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getAllHospitals = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/admin/all-hospitals",
        { headers: { aToken } }
      );
      if (data.success) {
        setHospitals(data.hospitals);
      } else {
        toast.error(data.message);
      }
      return Promise.resolve();
    } catch (error) {
      toast.error(error.message);
      return Promise.reject(error);
    }
  };

  const deleteHospital = async (hospitalId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/delete-hospital",
        { hospitalId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllHospitals();
        getAllDoctors(); // Refresh doctors to update hospital references
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateDoctor = async (formData) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/update-doctor",
        formData,
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
        return { success: true };
      } else {
        toast.error(data.message);
        return { success: false };
      }
    } catch (error) {
      toast.error(error.message);
      return { success: false };
    }
  };

  const updateHospital = async (formData) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/update-hospital",
        formData,
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllHospitals();
        getAllDoctors(); // Refresh doctors to update hospital references
        return { success: true };
      } else {
        toast.error(data.message);
        return { success: false };
      }
    } catch (error) {
      toast.error(error.message);
      return { success: false };
    }
  };

  const getAllAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/appointments", {
        headers: { aToken },
      });

      if (data.success) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/cancel-appointment",
        { appointmentId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getDashData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/dashboard", {
        headers: { aToken },
      });

      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const value = {
    aToken,
    setAToken,
    backendUrl,
    doctors,
    getAllDoctors,
    changeAvailability,
    deleteDoctor,
    updateDoctor,
    hospitals,
    getAllHospitals,
    deleteHospital,
    updateHospital,
    appointments,
    setAppointments,
    getAllAppointments,
    cancelAppointment,
    dashData,
    getDashData,
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;

import express from "express";
import {
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  addPrescription,
} from "../controllers/doctorController.js";
import authDoctor from "../middlewares/authDoctor.js";

const doctorRouter = express.Router();

doctorRouter.get("/list", doctorList);
doctorRouter.get("/detail/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await (await import("../models/doctorModel.js")).default
      .findById(id)
      .select(['-password', '-email'])
      .populate('hospitals', 'name type address phone email image description isActive')
      .lean();
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.json({
      success: true,
      doctor,
    });
  } catch (err) {
    console.error('Get doctor error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch doctor',
    });
  }
});
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);
doctorRouter.post("/add-prescription", authDoctor, addPrescription);

export default doctorRouter;

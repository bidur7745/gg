import express from "express";
import {
  addDoctor,
  allDoctors,
  loginAdmin,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  updateDoctor,
  deleteDoctor,
} from "../controllers/adminController.js";
import {
  addHospital,
  getAllHospitals,
  getHospital,
  updateHospital,
  deleteHospital,
} from "../controllers/hospitalController.js";
import upload from "../middlewares/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";

const adminRouter = express.Router();

// Auth
adminRouter.post("/login", loginAdmin);

// Doctor routes
adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
adminRouter.post("/all-doctors", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailability);
adminRouter.post("/update-doctor", authAdmin, upload.single("image"), updateDoctor);
adminRouter.post("/delete-doctor", authAdmin, deleteDoctor);

// Hospital routes
adminRouter.post("/add-hospital", authAdmin, upload.single("image"), addHospital);
adminRouter.get("/all-hospitals", authAdmin, getAllHospitals);
adminRouter.post("/get-hospital", authAdmin, getHospital);
adminRouter.post("/update-hospital", authAdmin, upload.single("image"), updateHospital);
adminRouter.post("/delete-hospital", authAdmin, deleteHospital);

// Appointment routes
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel);

// Dashboard
adminRouter.get("/dashboard", authAdmin, adminDashboard);

export default adminRouter;


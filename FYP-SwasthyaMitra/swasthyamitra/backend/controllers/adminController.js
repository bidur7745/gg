import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import hospitalModel from "../models/hospitalModel.js";

// API for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    // checking for all data to add doctor
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "Missing required details" });
    }

    if (!imageFile) {
      return res.json({ success: false, message: "Doctor image is required" });
    }

    // Check if doctor with same email already exists
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.json({
        success: false,
        message: "Doctor with this email already exists",
      });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // validating strong password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Validate fees
    if (isNaN(fees) || Number(fees) < 0) {
      return res.json({
        success: false,
        message: "Please enter a valid fee amount",
      });
    }

    // hashing doctor password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    // Parse hospitals if provided
    let hospitalsArr = [];
    if (req.body.hospitals) {
      try {
        hospitalsArr = JSON.parse(req.body.hospitals);
        // Validate hospital IDs exist
        if (Array.isArray(hospitalsArr) && hospitalsArr.length > 0) {
          const validHospitals = await hospitalModel.find({
            _id: { $in: hospitalsArr }
          });
          if (validHospitals.length !== hospitalsArr.length) {
            return res.json({
              success: false,
              message: "Some selected hospitals are invalid",
            });
          }
        }
      } catch (error) {
        return res.json({
          success: false,
          message: "Invalid hospital data format",
        });
      }
    }

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      hospitals: hospitalsArr,
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.json({ success: true, message: "Doctor Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({})
      .select("-password")
      .populate("hospitals", "name type address phone email image")
      .lean();
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // releasing doctor slot

    const { docId, slotDate, slotTime } = appointmentData;

    const doctorData = await doctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;

    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update doctor
const updateDoctor = async (req, res) => {
  try {
    const { docId, name, email, speciality, degree, experience, about, fees, address, hospitals } = req.body;

    if (!docId) {
      return res.json({ success: false, message: "Doctor ID is required" });
    }

    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== doctor.email) {
      const existingDoctor = await doctorModel.findOne({ email });
      if (existingDoctor) {
        return res.json({
          success: false,
          message: "Doctor with this email already exists",
        });
      }
      if (!validator.isEmail(email)) {
        return res.json({
          success: false,
          message: "Please enter a valid email address",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (speciality) updateData.speciality = speciality;
    if (degree) updateData.degree = degree;
    if (experience) updateData.experience = experience;
    if (about) updateData.about = about;
    if (fees !== undefined) {
      if (isNaN(fees) || Number(fees) < 0) {
        return res.json({
          success: false,
          message: "Please enter a valid fee amount",
        });
      }
      updateData.fees = Number(fees);
    }
    if (address) {
      try {
        updateData.address = JSON.parse(address);
      } catch {
        return res.json({
          success: false,
          message: "Invalid address format",
        });
      }
    }
    if (hospitals !== undefined) {
      try {
        const hospitalsArr = JSON.parse(hospitals);
        if (Array.isArray(hospitalsArr)) {
          // Validate hospital IDs exist
          if (hospitalsArr.length > 0) {
            const validHospitals = await hospitalModel.find({
              _id: { $in: hospitalsArr }
            });
            if (validHospitals.length !== hospitalsArr.length) {
              return res.json({
                success: false,
                message: "Some selected hospitals are invalid",
              });
            }
          }
          updateData.hospitals = hospitalsArr;
        } else {
          updateData.hospitals = [];
        }
      } catch {
        return res.json({
          success: false,
          message: "Invalid hospital data format",
        });
      }
    }

    // upload new image if provided
    if (req.file) {
      const imageUpload = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
      });
      updateData.image = imageUpload.secure_url;
    }

    await doctorModel.findByIdAndUpdate(docId, updateData);
    res.json({ success: true, message: "Doctor Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete doctor
const deleteDoctor = async (req, res) => {
  try {
    const { docId } = req.body;

    if (!docId) {
      return res.json({ success: false, message: "Doctor ID is required" });
    }

    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    // Check if doctor has any appointments
    const hasAppointments = await appointmentModel.exists({ docId });
    if (hasAppointments) {
      return res.json({
        success: false,
        message: "Cannot delete doctor with existing appointments. Please cancel appointments first.",
      });
    }

    await doctorModel.findByIdAndDelete(docId);
    res.json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  updateDoctor,
  deleteDoctor,
};

import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import hospitalModel from "../models/hospitalModel.js";
import doctorModel from "../models/doctorModel.js";

// API for adding hospital
const addHospital = async (req, res) => {
    try {
        const { name, email, phone, type, address, description } = req.body;
        const imageFile = req.file;

        if (!name || !email || !phone || !type || !address) {
            return res.json({ success: false, message: "Missing required details" });
        }

        // Check if hospital with same email already exists
        const existingHospital = await hospitalModel.findOne({ email });
        if (existingHospital) {
            return res.json({
                success: false,
                message: "Hospital with this email already exists",
            });
        }

        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        // Validate phone number (basic validation)
        if (phone.length < 10) {
            return res.json({
                success: false,
                message: "Please enter a valid phone number",
            });
        }

        if (!imageFile) {
            return res.json({ success: false, message: "Hospital image is required" });
        }

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
            resource_type: "image",
        });
        const imageUrl = imageUpload.secure_url;

        const hospitalData = {
            name,
            email,
            phone,
            type,
            image: imageUrl,
            address: JSON.parse(address),
            description: description || "",
            date: Date.now(),
        };

        const newHospital = new hospitalModel(hospitalData);
        await newHospital.save();

        res.json({ success: true, message: "Hospital Added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all hospitals
const getAllHospitals = async (req, res) => {
    try {
        const hospitals = await hospitalModel.find({});
        res.json({ success: true, hospitals });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get single hospital
const getHospital = async (req, res) => {
    try {
        const { hospitalId } = req.body;
        const hospital = await hospitalModel.findById(hospitalId);
        if (!hospital) {
            return res.json({ success: false, message: "Hospital not found" });
        }
        res.json({ success: true, hospital });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update hospital
const updateHospital = async (req, res) => {
    try {
        const { hospitalId, name, email, phone, type, address, description, isActive } = req.body;

        if (!hospitalId) {
            return res.json({ success: false, message: "Hospital ID is required" });
        }

        const hospital = await hospitalModel.findById(hospitalId);
        if (!hospital) {
            return res.json({ success: false, message: "Hospital not found" });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== hospital.email) {
            const existingHospital = await hospitalModel.findOne({ email });
            if (existingHospital) {
                return res.json({
                    success: false,
                    message: "Hospital with this email already exists",
                });
            }
            if (!validator.isEmail(email)) {
                return res.json({
                    success: false,
                    message: "Please enter a valid email address",
                });
            }
        }

        // Validate phone if provided
        if (phone && phone.length < 10) {
            return res.json({
                success: false,
                message: "Please enter a valid phone number",
            });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (type) updateData.type = type;
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
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

        // upload new image if provided
        if (req.file) {
            const imageUpload = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "image",
            });
            updateData.image = imageUpload.secure_url;
        }

        await hospitalModel.findByIdAndUpdate(hospitalId, updateData);
        res.json({ success: true, message: "Hospital Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to delete hospital
const deleteHospital = async (req, res) => {
    try {
        const { hospitalId } = req.body;

        if (!hospitalId) {
            return res.json({ success: false, message: "Hospital ID is required" });
        }

        const hospital = await hospitalModel.findById(hospitalId);
        if (!hospital) {
            return res.json({ success: false, message: "Hospital not found" });
        }

        // Remove hospital reference from all doctors
        const updateResult = await doctorModel.updateMany(
            { hospitals: hospitalId },
            { $pull: { hospitals: hospitalId } }
        );

        await hospitalModel.findByIdAndDelete(hospitalId);
        res.json({ 
            success: true, 
            message: `Hospital deleted successfully. Removed from ${updateResult.modifiedCount} doctor(s).` 
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    addHospital,
    getAllHospitals,
    getHospital,
    updateHospital,
    deleteHospital,
};

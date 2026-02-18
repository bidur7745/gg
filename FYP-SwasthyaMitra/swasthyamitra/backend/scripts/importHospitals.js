import mongoose from "mongoose";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import hospitalModel from "../models/hospitalModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(`${uri}/prescripto`, {
      bufferCommands: false,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// Read and parse hospital.json
const readHospitalData = () => {
  try {
    // Try to read from root directory (where hospital.json is located)
    const rootPath = path.resolve(__dirname, "../../hospital.json");
    const data = fs.readFileSync(rootPath, "utf8");
    const hospitals = JSON.parse(data);
    console.log(`📄 Found ${hospitals.length} hospitals in JSON file`);
    return hospitals;
  } catch (error) {
    console.error("❌ Error reading hospital.json:", error.message);
    console.error("   Make sure hospital.json exists in the project root");
    process.exit(1);
  }
};

// Import hospitals to database
const importHospitals = async () => {
  try {
    await connectDB();

    const hospitals = readHospitalData();
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log("\n🚀 Starting hospital import...\n");

    for (const hospital of hospitals) {
      try {
        // Check if hospital with same email already exists
        const existingHospital = await hospitalModel.findOne({ email: hospital.email });

        if (existingHospital) {
          console.log(`⏭️  Skipping "${hospital.name}" - email already exists: ${hospital.email}`);
          skipCount++;
          continue;
        }

        // Validate required fields
        if (!hospital.name || !hospital.email || !hospital.phone || !hospital.type || !hospital.address) {
          throw new Error("Missing required fields");
        }

        // Validate hospital type
        const validTypes = ["Government", "Private", "Community"];
        if (!validTypes.includes(hospital.type)) {
          throw new Error(`Invalid type: ${hospital.type}. Must be one of: ${validTypes.join(", ")}`);
        }

        // Create hospital document
        const hospitalData = {
          name: hospital.name,
          address: hospital.address,
          phone: hospital.phone,
          email: hospital.email,
          type: hospital.type,
          image: hospital.image || "",
          description: hospital.description || "",
          isActive: hospital.isActive !== undefined ? hospital.isActive : true,
          date: hospital.date || Date.now(),
        };

        const newHospital = new hospitalModel(hospitalData);
        await newHospital.save();

        console.log(`✅ Added: ${hospital.name} (${hospital.type})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error importing "${hospital.name}":`, error.message);
        errors.push({ hospital: hospital.name, error: error.message });
        errorCount++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Import Summary:");
    console.log(`   ✅ Successfully imported: ${successCount}`);
    console.log(`   ⏭️  Skipped (duplicates): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log("=".repeat(50));

    if (errors.length > 0) {
      console.log("\n⚠️  Errors encountered:");
      errors.forEach(({ hospital, error }) => {
        console.log(`   - ${hospital}: ${error}`);
      });
    }

    await mongoose.connection.close();
    console.log("\n✅ Import completed. Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the import
importHospitals();

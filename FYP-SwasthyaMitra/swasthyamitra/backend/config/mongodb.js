import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => console.log("Database connected"));
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI not set in .env — start MongoDB or set MONGODB_URI");
    return;
  }

  try {
    await mongoose.connect(`${uri}/prescripto`, {
      bufferCommands: false, // fail fast if not connected instead of 10s timeout
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message || err);
    console.error("→ Start MongoDB (e.g. run 'mongod' or start MongoDB service), then restart the server.");
  }
};

export default connectDB;

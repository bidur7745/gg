import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        address: { type: Object, required: true }, // { line1, line2 }
        phone: { type: String, required: true },
        email: { type: String, required: true },
        type: {
            type: String,
            required: true,
            enum: ["Government", "Private", "Community"],
        },
        image: { type: String, required: true },
        description: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
        date: { type: Number, required: true },
    },
    { minimize: false }
);

hospitalSchema.index({ name: 1 });
hospitalSchema.index({ type: 1 });

const hospitalModel =
    mongoose.models.hospital || mongoose.model("hospital", hospitalSchema);

export default hospitalModel;

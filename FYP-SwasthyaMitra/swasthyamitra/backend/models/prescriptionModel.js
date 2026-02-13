import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    appointmentId: { type: String, default: "" },
    diagnosis: { type: String, default: "" },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, default: "" },
        duration: { type: String, default: "" },
      },
    ],
    notes: { type: String, default: "" },
    docName: { type: String, default: "" },
    docSpeciality: { type: String, default: "" },
    date: { type: Number, required: true },
  },
  { minimize: false }
);

prescriptionSchema.index({ userId: 1 });
prescriptionSchema.index({ docId: 1 });

const prescriptionModel =
  mongoose.models.prescription ||
  mongoose.model("prescription", prescriptionSchema);

export default prescriptionModel;

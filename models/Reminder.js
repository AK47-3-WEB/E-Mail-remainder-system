import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  message: { type: String, required: true },
  scheduleTime: { type: Date, required: true },
  status: { type: String, default: "scheduled" }, // scheduled | sent | failed
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Reminder", reminderSchema);

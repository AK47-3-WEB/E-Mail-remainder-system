import express from "express";
import Reminder from "../models/Reminder.js";

const router = express.Router();

// POST /api/reminders
router.post("/", async (req, res) => {
  try {
    const { email, message, scheduleTime } = req.body;

    if (!email || !message || !scheduleTime)
      return res.status(400).json({ error: "All fields required" });

    const reminder = await Reminder.create({ email, message, scheduleTime });
    res.status(201).json({ message: "Reminder scheduled", reminder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reminders
router.get("/", async (req, res) => {
  const reminders = await Reminder.find().sort({ createdAt: -1 });
  res.json(reminders);
});

export default router;

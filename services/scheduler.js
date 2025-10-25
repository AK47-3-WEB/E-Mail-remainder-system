import cron from "node-cron";
import Reminder from "../models/Reminder.js";
import { sendEmail } from "./mailer.js";

export const startScheduler = () => {
  // Run every minute to check pending reminders
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Checking for due reminders...");

    const now = new Date();
    const reminders = await Reminder.find({
      status: "scheduled",
      scheduleTime: { $lte: now },
    });

    for (const reminder of reminders) {
      const success = await sendEmail(
        reminder.email,
        "⏰ Reminder Notification",
        reminder.message
      );

      reminder.status = success ? "sent" : "failed";
      await reminder.save();
    }
  });

  console.log("🔁 Reminder scheduler started...");
};

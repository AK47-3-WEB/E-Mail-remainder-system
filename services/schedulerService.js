const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Reminder = require('../models/Reminder');

// --- 1. Email Transporter Setup ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVICE_HOST,
    port: process.env.EMAIL_SERVICE_PORT,
    secure: process.env.EMAIL_SERVICE_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_SERVICE_USER,
        pass: process.env.EMAIL_SERVICE_PASS,
    },
});

/**
 * Converts a Date object to a node-cron compatible string.
 * Format: 'second minute hour day-of-month month day-of-week'
 * @param {Date} date - The schedule time.
 * @returns {string} The cron expression.
 */
const dateToCron = (date) => {
    const d = new Date(date);
    // Use the UTC time components to ensure scheduling consistency across time zones
    const second = d.getUTCSeconds();
    const minute = d.getUTCMinutes();
    const hour = d.getUTCHours();
    const dayOfMonth = d.getUTCDate();
    const month = d.getUTCMonth() + 1; // Months are 0-indexed
    return `${second} ${minute} ${hour} ${dayOfMonth} ${month} *`;
};

/**
 * Sends the email and updates the reminder status and logs.
 * @param {object} reminder - The Mongoose reminder document.
 */
const sendEmail = async (reminder) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_SERVICE_USER,
            to: reminder.email,
            subject: 'Scheduled Reminder',
            text: `Reminder message: ${reminder.message}`,
        };

        const info = await transporter.sendMail(mailOptions);
        
        // Update database for successful send
        reminder.status = 'SENT';
        reminder.deliveryLogs.push({
            success: true,
            message: `Email sent: ${info.response}`
        });
        await reminder.save();
        console.log(`[Scheduler] SUCCESS: Reminder for ${reminder.email} sent.`);

    } catch (error) {
        // Update database for failed send
        reminder.status = 'FAILED';
        reminder.deliveryLogs.push({
            success: false,
            message: `Email failure: ${error.message}`
        });
        await reminder.save();
        console.error(`[Scheduler] ERROR: Failed to send reminder to ${reminder.email}. Error: ${error.message}`);
    }
};

/**
 * Schedules a single reminder job.
 * @param {object} reminder - The Mongoose reminder document.
 */
const scheduleReminderJob = (reminder) => {
    const cronExpression = dateToCron(reminder.scheduleTime);

    // Schedule the job
    const job = cron.schedule(cronExpression, () => {
        sendEmail(reminder);
        job.stop(); // Stop the job after it executes once
    }, {
        scheduled: true,
        // Using 'Etc/UTC' ensures cron matches the UTC time stored in MongoDB
        timezone: "Etc/UTC" 
    });
    console.log(`[Scheduler] Job scheduled for ID ${reminder._id} at ${reminder.scheduleTime.toISOString()}`);
};

/**
 * Initializes the scheduler by finding all PENDING reminders
 * and scheduling them when the server starts.
 */
const initializeScheduler = async () => {
    try {
        // Find all pending reminders that are in the future
        const pendingReminders = await Reminder.find({ 
            status: 'PENDING',
            scheduleTime: { $gt: new Date() } // Only schedule future reminders
        });

        console.log(`[Scheduler] Found ${pendingReminders.length} PENDING reminders to reschedule.`);

        pendingReminders.forEach(reminder => {
            scheduleReminderJob(reminder);
        });

    } catch (error) {
        console.error('[Scheduler] FATAL ERROR during scheduler initialization:', error);
    }
};

module.exports = {
    scheduleReminderJob,
    initializeScheduler
};

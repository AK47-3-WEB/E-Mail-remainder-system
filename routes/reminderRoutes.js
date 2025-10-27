const express = require('express');
const Reminder = require('../models/Reminder');
const { scheduleReminderJob } = require('../services/schedulerService');
const router = express.Router();

// POST /api/reminders - Schedule a new reminder
router.post('/', async (req, res) => {
    const { email, message, scheduleTime } = req.body;

    // Basic validation
    if (!email || !message || !scheduleTime) {
        return res.status(400).json({ error: 'Missing required fields: email, message, and scheduleTime.' });
    }
    
    // Check if scheduleTime is in the future
    const time = new Date(scheduleTime);
    if (time <= new Date()) {
        return res.status(400).json({ error: 'Schedule time must be in the future.' });
    }

    try {
        // 1. Save reminder to MongoDB
        const newReminder = new Reminder({
            email,
            message,
            scheduleTime: time
        });
        await newReminder.save();

        // 2. Schedule the node-cron job
        scheduleReminderJob(newReminder);

        return res.status(201).json({ 
            message: 'Reminder scheduled successfully.', 
            reminderId: newReminder._id,
            scheduledAt: newReminder.scheduleTime
        });

    } catch (error) {
        console.error('Error scheduling reminder:', error);
        return res.status(500).json({ error: 'Failed to schedule reminder.', details: error.message });
    }
});

// GET /api/reminders - Retrieve all reminders (useful for admin/logging)
router.get('/', async (req, res) => {
    try {
        const reminders = await Reminder.find().sort({ createdAt: -1 });
        res.json(reminders);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ error: 'Failed to fetch reminders.' });
    }
});


module.exports = router;

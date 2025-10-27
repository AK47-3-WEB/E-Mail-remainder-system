const mongoose = require('mongoose');

// Schema for tracking the status of an email attempt
const LogSchema = new mongoose.Schema({
    attemptedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    success: {
        type: Boolean,
        required: true
    },
    message: {
        type: String,
        required: false, // Error message or success confirmation
        maxlength: 500
    }
}, { _id: false }); // Do not create a separate _id for log sub-documents

// Main Reminder Schema
const ReminderSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    scheduleTime: {
        type: Date,
        required: true,
        index: true // Index for fast querying of scheduled tasks
    },
    status: {
        type: String,
        enum: ['PENDING', 'SENT', 'FAILED', 'CANCELLED'],
        default: 'PENDING',
        required: true
    },
    // Array to store logs of delivery attempts (success or failure)
    deliveryLogs: [LogSchema]
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Reminder', ReminderSchema);

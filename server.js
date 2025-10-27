const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path'); 

// Load environment variables from config/.env
dotenv.config({ path: path.resolve(__dirname, 'config', '.env') });

const reminderRoutes = require('./routes/reminderRoutes');
const { initializeScheduler } = require('./services/schedulerService');

// Initialize App
const app = express();

// Middleware
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("--- FATAL ERROR ---");
    console.error("MONGO_URI is not defined in the environment variables.");
    console.error("Please ensure you have a .env file in the config folder and it contains MONGO_URI=your_connection_string");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully.");

        // Initialize the scheduler once the database is connected
        // This ensures all pending reminders are re-scheduled on startup.
        initializeScheduler();
    })
    .catch(err => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    });

// ------------------------------------------
// FRONTEND SERVING LOGIC (The Fix)
// ------------------------------------------

// Serve static files (like CSS/JS) from the 'public' directory
// This is necessary if your index.html references other static assets
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route: Serve index.html for the root path
// This is what ensures your browser loads the frontend UI instead of raw JSON
app.get('/', (req, res) => {
    // We assume the frontend file is saved as public/index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.use('/api/reminders', reminderRoutes);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
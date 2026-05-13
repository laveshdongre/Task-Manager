const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TaskFlow API is running 🚀', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects/:projectId/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));


// Serve React build (always serve build for Railway deployment)
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  // If the request doesn't match an API route, serve the React app
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 TaskFlow server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Basic server.js placeholder for Task 3
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    data: { status: 'healthy', timestamp: new Date().toISOString() },
    error: null,
    code: null
  });
});

// Placeholder route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    data: { message: 'Persona Arcana API - Phase 1 Foundation' },
    error: null,
    code: null
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
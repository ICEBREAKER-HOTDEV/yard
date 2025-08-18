const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the yard directory
app.use(express.static(path.join(__dirname, '../../../../../public_html/yard')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../../../public_html/yard/index.html'));
});

// API routes can be added here
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Yard Designer API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Yard Designer server running on http://localhost:${PORT}`);
});
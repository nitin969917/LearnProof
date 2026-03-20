const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));
app.use('/media', express.static('media')); // Serve static media files
app.use('/api/media', express.static('media')); // Compatibility for Passenger routing

// Routes
app.use('/api', apiRoutes);
app.use('/', apiRoutes); // Fallback for Hostinger/Passenger stripped routes

// Root endpoint
app.get('/', (req, res) => {
    res.send('LearnProof Express API is running!');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});

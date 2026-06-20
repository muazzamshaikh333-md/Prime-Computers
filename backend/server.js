require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const printRoutes = require('./routes/printRoutes');

const app = express();

// ─── Middleware ───
app.use(helmet({ crossOriginResourcePolicy: false })); // security headers
app.use(cors());                          // allow frontend to call this backend
app.use(express.json());                  // parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded PDFs statically (admin dashboard uses this to view/download files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───
app.use('/api/print-requests', printRoutes);

app.get('/', (req, res) => {
  res.send('Prime Computers backend is running ✅');
});

// ─── Connect to MongoDB, then start server ───
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

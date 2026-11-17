const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const procurementRoutes = require('./routes/procurementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const migrate = require('./database/migrate');
const { expireDueReservations } = require('./controllers/reservationController');
const { expireReadyRequests } = require('./controllers/procurementController');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'MediFind – Intelligent Medicine Discovery & Reservation Platform',
    timestamp: new Date().toISOString()
  });
});

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start listening if run directly
if (require.main === module) {
  migrate()
    .then(() => {
      Promise.all([expireDueReservations(), expireReadyRequests()])
        .catch(error => console.error('Initial pickup expiry sweep failed:', error));
      setInterval(() => {
        Promise.all([expireDueReservations(), expireReadyRequests()])
          .catch(error => console.error('Pickup expiry sweep failed:', error));
      }, 60 * 1000).unref();
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 MediFind Backend Server running on http://localhost:${PORT}`);
        console.log(`🩺 Health check available at http://localhost:${PORT}/api/health`);
      });
    })
    .catch(error => {
      console.error('Unable to start MediFind before database migrations completed:', error);
      process.exit(1);
    });
}

module.exports = app;

require("dotenv").config();   // Load environment variables at the very start
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// ROUTES
const bullBoardRouter = require('./admin/bullBoard');
const authRoutes = require('./api/routes/authRoutes');
const profileRoutes = require('./api/routes/profileRoutes');
const aiContentRoutes = require('./api/routes/aiContentRoutes');
const postRoutes = require('./api/routes/postRoutes');
const socialRoutes = require('./api/routes/socialRoutes');
const publicPlansRoutes = require('./api/routes/publicPlans');
const subscriptionsRoutes = require('./api/routes/subscriptions');
const paymentsRoutes = require('./api/routes/payments');

// SUPER ADMIN
const superAdminRoutes = require('./superadmin/routes/superadmin.routes');


const app = express();

/* ----------------------------------------------------
   CORS CONFIG (PRODUCTION READY)
---------------------------------------------------- */
app.use(
  cors({
    origin: true,               // allows frontend URLs dynamically
    credentials: true,          // allow cookies
  })
);

/* ----------------------------------------------------
   BODY PARSING
---------------------------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ----------------------------------------------------
   MONGO CONNECTION HANDLER
---------------------------------------------------- */
async function ensureMongoConnection(req, res, next) {
  console.log(`=== MIDDLEWARE HIT: ${req.method} ${req.path} ===`);

  if (req.method === 'OPTIONS') {
    console.log("OPTIONS request - skipping middleware");
    return next(); // never block preflight
  }

  console.log("MongoDB connection state:", mongoose.connection.readyState);

  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected - proceeding");
    return next();
  }

  try {
    console.log("Attempting MongoDB connection...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for request.");
    return next();
  } catch (err) {
    console.error('Mongo connection error:', err.message);
    return res.status(500).json({ message: 'Database not available' });
  }
}

/* ----------------------------------------------------
   PUBLIC API ROUTES
---------------------------------------------------- */
app.use('/api', ensureMongoConnection);

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', aiContentRoutes);
app.use('/api', postRoutes);
app.use('/api', socialRoutes);

// Public plans and subscription/payment endpoints
app.use('/api/public', publicPlansRoutes);
app.use('/public', publicPlansRoutes); // also expose '/public/plans' per spec
app.use('/api', subscriptionsRoutes);
app.use('/api', paymentsRoutes);

/* ----------------------------------------------------
   SUPER ADMIN API (SEPARATE FROM USER API)
   NOTE: Also mount under /api/super-admin so frontend uses with
   NEXT_PUBLIC_API_URL (which includes /api) will work without changes.
---------------------------------------------------- */
app.use('/super-admin', ensureMongoConnection, superAdminRoutes);
app.use('/api/super-admin', ensureMongoConnection, superAdminRoutes);

/* ----------------------------------------------------
   DEV-ONLY QUEUE DASHBOARD
---------------------------------------------------- */
if (process.env.NODE_ENV !== 'production') {
  app.use('/', bullBoardRouter);
}

/* ----------------------------------------------------
   HEALTH CHECK
---------------------------------------------------- */
app.get('/', (req, res) => {
  res.send('API is running...');
});

/* ----------------------------------------------------
   CENTRAL ERROR HANDLER
---------------------------------------------------- */
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS blocked request' });
  }

  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server error' });
});

module.exports = app;

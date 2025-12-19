const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const mongoose = require('mongoose');
const bullBoardRouter = require('./admin/bullBoard'); // new file we added
const authRoutes = require('./api/routes/authRoutes');
const profileRoutes = require('./api/routes/profileRoutes');
const aiContentRoutes = require('./api/routes/aiContentRoutes');
const postRoutes = require('./api/routes/postRoutes'); // Import the new routes
const socialRoutes = require('./api/routes/socialRoutes');


// --- Middleware ---

// Startup sanity checks for critical env/config in production
if (process.env.NODE_ENV === 'production') {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  // Firebase envs are optional if JSON file exists, but warn if neither is present
  const hasFirebaseEnvs = !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY;
  try {
    // Attempt to resolve local JSON fallback as well (optional)
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require('./config/serviceAccountKey.json');
  } catch (e) {
    if (!hasFirebaseEnvs) {
      missing.push('FIREBASE_* or serviceAccountKey.json');
    }
  }
  if (missing.length) {
    console.warn(`[Startup Warning] Missing required configuration: ${missing.join(', ')}`);
  }
}

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://post-generator-frontend-henna.vercel.app", // production url
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // In dev, allow any localhost/127.0.0.1 origins
      if (process.env.NODE_ENV !== 'production') {
        if (/^(http:\/\/)?(localhost|127\.0\.0\.1):\d+$/i.test(origin)) {
          return callback(null, true);
        }
      }

      // Check allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(`Blocked by CORS: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Ensure MongoDB connection before handling requests (for serverless/runtime cold starts)
let mongoReady = false;
async function ensureMongoConnection(req, res, next) {
  if (mongoReady) return next();
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    mongoReady = true;
    return next();
  } catch (err) {
    console.error('Mongo connection error:', err.message);
    return res.status(500).json({ message: 'Database not available' });
  }
}


// --- Your Routes ---

app.use('/api', ensureMongoConnection);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', aiContentRoutes);
// ... app.use(cors()), app.use(express.json())
// ... your other routes (auth, profile, aiContentRoutes)
app.use('/api', postRoutes); // Add the new post routes
app.use('/api', socialRoutes);
// expose bull board UI (protect in prod)
app.use('/', bullBoardRouter); // admin UI available at /admin/queues


// Simple test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// This function will catch any errors that occur in your routes
app.use((err, req, res, next) => {
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Not allowed by CORS'
    });
  }

  console.error(err.stack); // Log the error stack for debugging
  res.status(500).json({
    error: 'An unexpected error occurred.',
    message: err.message // Send a clean message to the client
  });
});
// ----------------------------------------------------


module.exports = app;

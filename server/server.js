import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import apiRouter from './routes/api.js';
import { ensureInitialSetup } from './database/db.js';

const app = express();

const PORT = process.env.PORT || 5000;


// ==================================================
// CORS CONFIGURATION
// ==================================================

// Local frontend URLs
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];


// Production URLs from .env
//
// You can provide multiple URLs:
//
// CLIENT_URL=https://abc.vercel.app,https://example.com
//
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);


// Combine local + production URLs
const allowedOrigins = [
  ...new Set([
    ...defaultOrigins,
    ...envOrigins
  ])
];


console.log(
  'Allowed CORS origins:',
  allowedOrigins
);


// ==================================================
// CORS OPTIONS
// ==================================================

const corsOptions = {

  origin(origin, callback) {

    // Allow requests without Origin header
    // Example:
    // Postman
    // curl
    // server-to-server requests
    if (!origin) {
      return callback(null, true);
    }


    // Allow known frontend URLs
    if (allowedOrigins.includes(origin)) {

      return callback(
        null,
        true
      );

    }


    // Block unknown origins
    console.error(
      `CORS blocked origin: ${origin}`
    );

    return callback(
      new Error(
        `CORS blocked origin: ${origin}`
      )
    );

  },


  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],


  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],


  credentials: true,


  optionsSuccessStatus: 204
};


// Apply CORS
app.use(
  cors(corsOptions)
);


// ==================================================
// GENERAL MIDDLEWARE
// ==================================================

app.use(
  morgan('dev')
);


app.use(
  express.json({
    limit: '2mb'
  })
);


app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb'
  })
);


// ==================================================
// API ROUTES
// ==================================================

app.use(
  '/api',
  apiRouter
);


// ==================================================
// HEALTH CHECK
// ==================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({

      status: 'OK',

      name:
        'Ganpati Mandal API Server',

      name_mr:
        'गणपती मंडळ व्यवस्थापन API',

      time:
        new Date().toISOString()

    });

  }
);


// ==================================================
// 404 HANDLER
// ==================================================

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`

    });

  }
);


// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use(
  (err, req, res, next) => {

    console.error(
      'Unhandled Error:',
      err
    );


    // CORS error
    if (
      err.message &&
      err.message.startsWith(
        'CORS blocked origin'
      )
    ) {

      return res
        .status(403)
        .json({

          success: false,

          message:
            err.message

        });

    }


    return res
      .status(
        err.status || 500
      )
      .json({

        success: false,

        message:
          err.message ||
          'अंतर्गत सर्व्हर त्रुटी निर्माण झाली. (Internal Server Error)'

      });

  }
);


// ==================================================
// START SERVER
// ==================================================

async function startServer() {

  try {

    console.log(
      'Initializing Supabase...'
    );


    // Connect Supabase
    // Create/check storage bucket
    // Create initial settings/admin if required
    await ensureInitialSetup();


    app.listen(
      PORT,
      '0.0.0.0',
      () => {

        console.log(
          '=========================================='
        );

        console.log(
          `Ganpati Mandal API running on port ${PORT}`
        );

        console.log(
          `Health: http://localhost:${PORT}/api/health`
        );

        console.log(
          '=========================================='
        );

      }
    );

  } catch (error) {

    console.error(
      'Failed to start server:',
      error
    );

    process.exit(1);

  }

}


startServer();
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { ensureInitialSetup } from './database/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    name: 'Ganpati Mandal API Server',
    name_mr: 'गणपती मंडळ व्यवस्थापन API',
    time: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'अंतर्गत सर्व्हर त्रुटी निर्माण झाली. (Internal Server Error)'
  });
});

// Auto-initialize DB and ensure base setup
async function startServer() {
  try {
    await ensureInitialSetup();

    app.listen(PORT, () => {
      console.log(`\n🕉️ ========================================================`);
      console.log(`🕉️ गणपती मंडळ व्यवस्थापन प्रणाली (Backend Server)`);
      console.log(`🕉️ Server running on: http://localhost:${PORT}`);
      console.log(`🕉️ API Endpoint: http://localhost:${PORT}/api`);
      console.log(`🕉️ Ganpati Bappa Morya! 🙏`);
      console.log(`🕉️ ========================================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Standard middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to AssetFlow API'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

export default app;

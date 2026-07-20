import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import assetRoutes from './routes/asset.routes';

const app = express();

// Standard middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/api/auth', authRoutes);

// Category Routes
app.use('/api/categories', categoryRoutes);

// Asset Routes
app.use('/api/assets', assetRoutes);

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to AssetFlow API',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

export default app;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import healthRouter from './routes/health';
import dashboardRouter from './routes/dashboard';
import authRouter from './routes/auth';
import farmersRouter from './routes/farmers';
import farmsRouter from './routes/farms';
import fieldsRouter from './routes/fields';
import soilTestsRouter from './routes/soilTests';
import waterSourcesRouter from './routes/waterSources';
import irrigationRouter from './routes/irrigation';
import cropsRouter from './routes/crops';
import cropVarietiesRouter from './routes/cropVarieties';
import seasonsRouter from './routes/seasons';
import cropSeasonsRouter from './routes/cropSeasons';
import suppliersRouter from './routes/suppliers';
import inventoryRouter from './routes/inventory';
import seedsRouter from './routes/seeds';
import fertilizersRouter from './routes/fertilizers';
import pesticidesRouter from './routes/pesticides';
import workersRouter from './routes/workers';
import attendanceRouter from './routes/attendance';
import equipmentRouter from './routes/equipment';
import maintenanceRouter from './routes/maintenance';
import workerEquipmentRouter from './routes/workerEquipment';
import customersRouter from './routes/customers';
import harvestsRouter from './routes/harvests';
import salesRouter from './routes/sales';
import paymentsRouter from './routes/payments';
import phonesRouter from './routes/phones';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    const isVercelAllowed = config.corsOrigins.some((o) => o.includes('vercel.app')) && origin.endsWith('.vercel.app');
    if (isVercelAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auth rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan('combined'));

// API Routes & Health Checks
app.get('/', (req, res) => res.json({ success: true, service: 'Agricultural Farm Management API', health: '/api/health' }));
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/farmers', farmersRouter);
app.use('/api/farms', farmsRouter);
app.use('/api/fields', fieldsRouter);
app.use('/api/soil-tests', soilTestsRouter);
app.use('/api/water-sources', waterSourcesRouter);
app.use('/api/irrigation', irrigationRouter);
app.use('/api/crops', cropsRouter);
app.use('/api/crop-varieties', cropVarietiesRouter);
app.use('/api/seasons', seasonsRouter);
app.use('/api/crop-seasons', cropSeasonsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/seeds', seedsRouter);
app.use('/api/fertilizers', fertilizersRouter);
app.use('/api/pesticides', pesticidesRouter);
app.use('/api/workers', workersRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/worker-equipment', workerEquipmentRouter);
app.use('/api/customers', customersRouter);
app.use('/api/harvests', harvestsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/phones', phonesRouter);

// Error handling
app.use(errorHandler);

export default app;

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
import usersRouter from './routes/users';
import auditLogsRouter from './routes/auditLogs';
import { authenticateSession, authorizeEntity } from './middleware/auth';

const app = express();

// Security middleware
app.use(helmet());
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow any localhost/127.0.0.1 port in development
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocalhost) {
      return callback(null, true);
    }
    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    const isVercelAllowed = config.corsOrigins.some((o) => o.includes('vercel.app')) && origin.endsWith('.vercel.app');
    if (isVercelAllowed) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept'],
  exposedHeaders: ['X-CSRF-Token'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

// Health Checks (Public for cloud monitors)
app.get('/', (req, res) => res.json({ success: true, service: 'Agricultural Farm Management API', health: '/api/health' }));
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

// Authentication (Rate-limited, Public login/register endpoints)
app.use('/api/auth', authLimiter, authRouter);

// User & Role Management (Admin only)
app.use('/api/users', usersRouter);

// Security Audit Logs (Admin only)
app.use('/api/audit-logs', auditLogsRouter);

// Protected Analytics & Land Operations
app.use('/api/dashboard', authenticateSession, authorizeEntity('dashboard'), dashboardRouter);
app.use('/api/farmers', authenticateSession, authorizeEntity('farmers'), farmersRouter);
app.use('/api/farms', authenticateSession, authorizeEntity('farms'), farmsRouter);
app.use('/api/fields', authenticateSession, authorizeEntity('fields'), fieldsRouter);
app.use('/api/soil-tests', authenticateSession, authorizeEntity('soilTests'), soilTestsRouter);
app.use('/api/water-sources', authenticateSession, authorizeEntity('waterSources'), waterSourcesRouter);
app.use('/api/irrigation', authenticateSession, authorizeEntity('irrigation'), irrigationRouter);

// Crops & Production
app.use('/api/crops', authenticateSession, authorizeEntity('crops'), cropsRouter);
app.use('/api/crop-varieties', authenticateSession, authorizeEntity('cropVarieties'), cropVarietiesRouter);
app.use('/api/seasons', authenticateSession, authorizeEntity('seasons'), seasonsRouter);
app.use('/api/crop-seasons', authenticateSession, authorizeEntity('cropSeasons'), cropSeasonsRouter);
app.use('/api/harvests', authenticateSession, authorizeEntity('harvests'), harvestsRouter);

// Inventory & Supplies
app.use('/api/suppliers', authenticateSession, authorizeEntity('suppliers'), suppliersRouter);
app.use('/api/inventory', authenticateSession, authorizeEntity('inventory'), inventoryRouter);
app.use('/api/seeds', authenticateSession, authorizeEntity('seeds'), seedsRouter);
app.use('/api/fertilizers', authenticateSession, authorizeEntity('fertilizers'), fertilizersRouter);
app.use('/api/pesticides', authenticateSession, authorizeEntity('pesticides'), pesticidesRouter);

// Workforce & Equipment
app.use('/api/workers', authenticateSession, authorizeEntity('workers'), workersRouter);
app.use('/api/attendance', authenticateSession, authorizeEntity('attendance'), attendanceRouter);
app.use('/api/equipment', authenticateSession, authorizeEntity('equipment'), equipmentRouter);
app.use('/api/maintenance', authenticateSession, authorizeEntity('maintenance'), maintenanceRouter);
app.use('/api/worker-equipment', authenticateSession, authorizeEntity('workerEquipment'), workerEquipmentRouter);

// Commerce & Sales
app.use('/api/customers', authenticateSession, authorizeEntity('customers'), customersRouter);
app.use('/api/sales', authenticateSession, authorizeEntity('sales'), salesRouter);
app.use('/api/payments', authenticateSession, authorizeEntity('payments'), paymentsRouter);

// Phone Records (Handled by internal authorizeEntity checks)
app.use('/api/phones', phonesRouter);

// Error handling
app.use(errorHandler);

export default app;

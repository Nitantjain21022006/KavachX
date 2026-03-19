import dotenv from 'dotenv';
dotenv.config();

// Patch console FIRST so every subsequent log line is captured by logBroadcaster
import logBroadcaster from './utils/logBroadcaster.js';
logBroadcaster.patch();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import corsOptions from './config/cors.js';
import pool from './utils/db.js';
import errorMiddleware from './middleware/error.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/events.routes.js';
import alertRoutes from './routes/alerts.routes.js';
import responseRoutes from './routes/responses.routes.js';
import systemRoutes from './routes/system.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import simulatorRoutes from './routes/simulator.routes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/simulator', simulatorRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'Cyber-Resilient Platform API is running' });
});

// Error Handling
app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

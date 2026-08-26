import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// routes
app.use('/api', apiRouter);

// for unmatched routes
app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// error handling for all routes
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error caught in app handler:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
});

export default app;
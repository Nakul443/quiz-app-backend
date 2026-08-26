import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(` Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error(` Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(` Failed to start server: ${(error as Error).message}`);
    process.exit(1);
  }
};

startServer();
import app from './app.js';
import connectDB from './config/db.js';
import { env } from './config/env.js';

const startServer = () => {
  app.listen(env.port, async () => {
    console.log(`Server is running on port ${env.port}`);
    await connectDB();
  });
};

startServer();

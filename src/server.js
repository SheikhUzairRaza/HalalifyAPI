import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer =() => {
  

  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
  });
};

startServer();

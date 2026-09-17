import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';
import swaggerSpec from './config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Built-in Middlewares
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve interactive test UI clients
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '../test.html'));
});

app.get('/test-google', (req, res) => {
  res.sendFile(path.join(__dirname, '../google-test.html'));
});

// Swagger UI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;

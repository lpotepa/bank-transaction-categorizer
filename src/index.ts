import express from 'express';
import bodyParser from 'body-parser';
import { AppDataSource } from '../ormconfig';
import transactionRoutes from './routes/transactions';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './swaggerConfig';  // Import the OpenAPI document

// Conditionally load the correct .env file
if (process.env.NODE_ENV === 'test') {
  console.log('Loading test environment variables');
  require('dotenv').config({ path: '.env.test' });
} else {
  require('dotenv').config();
}

const app = express();
const port = process.env.PORT || 3000;

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use(bodyParser.json());

// Connect to the database
AppDataSource.initialize()
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });

// Use the routes
app.use('/', transactionRoutes);

// Start the server
let server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export for testing purposes
export { app, server };

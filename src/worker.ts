import './queue/categorizeQueueProcessor';
import { AppDataSource } from '../ormconfig';

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Worker connected to the database');
  })
  .catch((error) => {
    console.error('Error connecting to the database', error);
  });

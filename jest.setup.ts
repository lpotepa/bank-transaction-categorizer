import dotenv from 'dotenv';
import path from 'path';
import { AppDataSource } from './ormconfig';

// Load .env.test file
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export const setupTestDB = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.runMigrations();
}
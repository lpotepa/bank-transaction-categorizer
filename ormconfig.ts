import { DataSource } from 'typeorm';
import { Category } from './src/models/Category';
import { Transaction } from './src/models/Transaction';
import dotenv from 'dotenv';

// Load environment variables
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env.development';
dotenv.config({ path: envFile });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [Transaction, Category],
  synchronize: false,
  logging: false,
  migrations: ['src/migrations/*.ts'],
});
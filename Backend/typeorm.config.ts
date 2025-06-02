import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User, Mission, Financier, Participant } from './src/entities';
import * as process from 'process';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // set to false for production
  logging: true,
  entities: [User, Mission, Financier, Participant],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

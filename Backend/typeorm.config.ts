import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User, Mission } from './src/entities/entities.js';
import * as process from 'process';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // use false in production
  logging: true,
  entities: [User, Mission],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});

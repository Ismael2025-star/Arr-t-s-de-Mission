import { DataSource } from 'typeorm';
import { User, Mission, Financier, Participant } from './src/entities';
import { envConfig } from './src/config/env.config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: envConfig.DB_HOST,
  port: envConfig.DB_PORT,
  username: envConfig.DB_USERNAME,
  password: envConfig.DB_PASSWORD,
  database: envConfig.DB_NAME,
  synchronize: false, // set to false for production
  logging: envConfig.NODE_ENV === 'development',
  entities: [User, Mission, Financier, Participant],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
  ssl: envConfig.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

import * as process from 'process';

export interface EnvConfig {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SSL_MODE: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

export const getEnvConfig = (): EnvConfig => {
  return {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME || '',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || '',
    DB_SSL_MODE: process.env.DB_SSL_MODE || 'disable',
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
  };
};

export const envConfig: EnvConfig = getEnvConfig();

export const envConfig = getEnvConfig();

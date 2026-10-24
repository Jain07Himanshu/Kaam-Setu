import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'hyperlocal_dev_super_secret_jwt_key_2026_change_in_prod',
  jwtExpiresIn: '7d',
  corsOrigins: [
    process.env.CLIENT_URL_CUSTOMER || 'http://localhost:5173',
    process.env.CLIENT_URL_WORKER || 'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
};

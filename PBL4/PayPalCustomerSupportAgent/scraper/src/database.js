import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'paypalAgent',
  password: process.env.POSTGRES_PASSWORD || 'your_password_here',
  port: 5432,
});

export default pool;
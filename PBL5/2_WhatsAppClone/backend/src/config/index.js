// Loads env & config
import dotenv from 'dotenv';
dotenv.config();

// Export all configs
const DATABASE_URL = process.env.DATABASE_URL;
export { DATABASE_URL };

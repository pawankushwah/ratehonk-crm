import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from './config';

// Use DATABASE_URL from config system (works without .env files)
const connectionString = config.database.url;
console.log('Using database connection string:', connectionString);
let sql: any;
let db: any;

try {
  sql = postgres(connectionString, {
    ssl: 'require',
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {}, // Suppress notices
  });
  
  db = drizzle(sql);
  console.log('Database connection initialized successfully');
} catch (error) {
  console.error('Database initialization failed:', error);
  // Don't throw - let the app start and handle errors in routes
}

export { db, sql };

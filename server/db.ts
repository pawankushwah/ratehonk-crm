import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { config } from './config';

// Use DATABASE_URL from config system (works without .env files)
const connectionString = config.database.url;
console.log('Using database connection string:', connectionString);
let sql: any;
let db: any;

try {
  // Determine SSL mode based on connection string
  const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const isNeon = connectionString.includes('neon.tech');
  
  sql = postgres(connectionString, {
    prepare: false,
    ssl: isLocalhost ? false : (isNeon ? { rejectUnauthorized: false } : 'require'),
    max: 20,
    idle_timeout: 20,
    connect_timeout: 60, // Increased to 60 seconds for better reliability with remote databases
    onnotice: () => {}, // Suppress notices
    transform: {
      undefined: null, // Transform undefined to null for PostgreSQL compatibility
    },
    // Add connection retry logic
    connection: {
      application_name: 'ratehonk-crm',
    },
    // Add connection retry on timeout
    max_lifetime: 60 * 30, // 30 minutes
  });
  
  db = drizzle(sql);
  console.log('Database connection initialized successfully');
} catch (error) {
  console.error('Database initialization failed:', error);
  // Don't throw - let the app start and handle errors in routes
}

export { db, sql };

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL;

// Configure postgres client with better connection settings
// Increased max connections to handle concurrent requests better
const client = postgres(connectionString, {
  max: 20, // Maximum number of connections in the pool (increased from 10)
  idle_timeout: 10, // Close idle connections after 10 seconds (reduced to free up connections faster)
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Maximum lifetime of a connection in seconds (30 minutes)
  onnotice: () => {}, // Suppress notices
  transform: {
    undefined: null, // Transform undefined to null
  },
});

export const db = drizzle(client, { schema });
// Export the postgres client for raw SQL queries when needed
export { client as postgresClient };

/**
 * Test database connection
 * Useful for debugging connection issues
 */
export async function testConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}


import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres((env.POSTGRES_URL || process.env.POSTGRES_URL)!);
if ((env.NODE_ENV || process.env.NODE_ENV) !== 'production') globalForDb.conn = conn;

export const db = drizzle(conn);

export { conn };
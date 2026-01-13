import { initDb } from '@/lib/db';

export function runMigrations() {
  try {
    initDb();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

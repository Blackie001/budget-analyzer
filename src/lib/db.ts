import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'finance.db');
const db = new Database(dbPath);

export function initDb() {
  // Turn on WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create tables
  const createMonthsTable = `
    CREATE TABLE IF NOT EXISTS months (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      UNIQUE(month, year)
    );
  `;

  const createIncomesTable = `
    CREATE TABLE IF NOT EXISTS incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month_id INTEGER NOT NULL,
      source TEXT NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (month_id) REFERENCES months (id) ON DELETE CASCADE
    );
  `;

  const createBudgetItemsTable = `
    CREATE TABLE IF NOT EXISTS budget_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      budgeted_amount REAL NOT NULL,
      is_locked BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY (month_id) REFERENCES months (id) ON DELETE CASCADE
    );
  `;

  const createExpensesTable = `
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      transaction_cost REAL DEFAULT 0,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (month_id) REFERENCES months (id) ON DELETE CASCADE
    );
  `;

  db.exec(createMonthsTable);
  db.exec(createIncomesTable);
  db.exec(createBudgetItemsTable);
  db.exec(createExpensesTable);
}

export default db;

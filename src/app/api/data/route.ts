import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!month || !year) {
    // List all available months
    const months = db.prepare('SELECT * FROM months ORDER BY year DESC, month DESC').all();
    return NextResponse.json(months);
  }

  // Get specific month or create if not exists
  let m = db.prepare('SELECT * FROM months WHERE month = ? AND year = ?').get(month, year);
  
  if (!m) {
    const info = db.prepare('INSERT INTO months (month, year) VALUES (?, ?)').run(month, year);
    m = { id: info.lastInsertRowid, month, year };
  }

  // Fetch details (Incomes, Budgets, Expenses)
  const incomes = db.prepare('SELECT * FROM incomes WHERE month_id = ?').all(m.id);
  const budgets = db.prepare('SELECT * FROM budget_allocations WHERE month_id = ?').all(m.id);
  const expenses = db.prepare('SELECT * FROM expenses WHERE month_id = ?').all(m.id);

  return NextResponse.json({ ...m, incomes, budgets, expenses });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Handle different actions
    if (action === 'add_income') {
        const { month_id, source, amount } = data;
        db.prepare('INSERT INTO incomes (month_id, source, amount) VALUES (?, ?, ?)').run(month_id, source, amount);
        return NextResponse.json({ success: true });
    }
    
    if (action === 'update_budget') {
        // Full budget creation/update (usually done after income changes)
        // data.items = [{ category, amount, is_locked }]
        const { month_id, items } = data;
        const insert = db.prepare('INSERT INTO budget_allocations (month_id, category, budgeted_amount, is_locked) VALUES (?, ?, ?, ?)');
        
        // Transaction to replace budgets
        const updateTransaction = db.transaction((items) => {
            db.prepare('DELETE FROM budget_allocations WHERE month_id = ?').run(month_id);
            for (const item of items) {
                insert.run(month_id, item.category, item.amount, item.is_locked ? 1 : 0);
            }
        });
        updateTransaction(items);
        return NextResponse.json({ success: true });
    }

    if (action === 'add_expense') {
        const { month_id, category, description, amount, transaction_cost } = data;
        db.prepare('INSERT INTO expenses (month_id, category, description, amount, transaction_cost) VALUES (?, ?, ?, ?, ?)').run(month_id, category, description, amount, transaction_cost || 0);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

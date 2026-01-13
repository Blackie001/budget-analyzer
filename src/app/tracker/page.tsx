'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './tracker.module.css';

export const dynamic = 'force-dynamic';

// Type definitions
type Income = { id?: number; source: string; amount: number };
type BudgetItem = { category: string; amount: number; is_locked: boolean; actual: number };
type Expense = { id?: number; category: string; description: string; amount: number; transaction_cost: number; date: string };

const LOCKED_CATEGORIES = ['Tithe', 'Rent', 'Savings'];
const FLEXIBLE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Airtime', 'Personal'];

const DEFAULT_PCT: Record<string, number> = {
  'Tithe': 0.20,
  'Savings': 0.15,
  'Rent': 0.20,
  'Food': 0.25,
  'Transport': 0.08,
  'Utilities': 0.10,
  'Airtime': 0.03,
  'Personal': 0.10,
};

// Savings sub-split
const SAVINGS_SPLIT = {
  'MFF': 0.40,
  'Mali': 0.30,
  'Lofty Coban': 0.15,
  'Caritus': 0.15
};

export default function TrackerPage() {
  const searchParams = useSearchParams();
  const month = parseInt(searchParams.get('month') || '1');
  const year = parseInt(searchParams.get('year') || '2024');

  const [monthData, setMonthData] = useState<any>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/data?month=${month}&year=${year}`);
      const data = await res.json();

      setMonthData(data);
      setIncomes(data.incomes || []);
      setExpenses(data.expenses || []);

      // If budget exists in DB, use it, else calculate default
      if (data.budgets && data.budgets.length > 0) {
        // Map DB budgets to UI state
        const mapped = data.budgets.map((b: any) => ({
          category: b.category,
          amount: b.budgeted_amount,
          is_locked: !!b.is_locked,
          actual: 0 // Will calculate from expenses later
        }));
        setBudgetItems(mapped);
      } else {
        // Initialize empty budget provided we have income? No wait for income.
        setBudgetItems([]);
      }
      setLoading(false);
    }
    load();
  }, [month, year]);

  // Derived Totals
  const totalIncome = (incomes: Income[]) => incomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const currentTotalIncome = useMemo(() => totalIncome(incomes), [incomes]);

  // Calculate Budget function
  const calculateBudget = () => {
    if (currentTotalIncome === 0) return;

    // Distribute
    const newBudget: BudgetItem[] = [];

    // Fixed
    LOCKED_CATEGORIES.forEach(cat => {
      newBudget.push({
        category: cat,
        amount: currentTotalIncome * (DEFAULT_PCT[cat] || 0),
        is_locked: true,
        actual: 0
      });
    });

    // Flexible (scaled to fit remaining 45% because defaults sum to > 100%)
    // Defaults for flex sum to 56%. Remaining is 45%. Scale factor = 45/56 = ~0.8
    const flexSum = 0.56;
    const available = 0.45;
    const scale = available / flexSum;

    FLEXIBLE_CATEGORIES.forEach(cat => {
      const basePct = DEFAULT_PCT[cat];
      // We force it to fit
      const adjustedAmount = currentTotalIncome * (basePct * scale);
      newBudget.push({
        category: cat,
        amount: adjustedAmount,
        is_locked: false,
        actual: 0
      });
    });

    setBudgetItems(newBudget);
    saveBudget(newBudget);
  };

  // Sync Expenses to Budget Actuals
  const processedBudget = useMemo(() => {
    // Clone budget
    const items = budgetItems.map(b => ({ ...b, actual: 0 }));
    expenses.forEach(e => {
      const item = items.find(i => i.category === e.category);
      if (item) {
        item.actual += e.amount + (e.transaction_cost || 0);
      }
    });
    return items;
  }, [budgetItems, expenses]);


  // Actions
  const addIncome = async (source: string, amount: number) => {
    await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add_income',
        month_id: monthData.id,
        source,
        amount
      })
    });
    // Optimistic update
    setIncomes([...incomes, { source, amount }]);
  };

  const saveBudget = async (items: BudgetItem[]) => {
    await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_budget',
        month_id: monthData.id,
        items
      })
    });
  };

  const addExpense = async (category: string, desc: string, amount: number, cost: number) => {
    await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add_expense',
        month_id: monthData.id,
        category,
        description: desc,
        amount,
        transaction_cost: cost
      })
    });
    setExpenses([...expenses, { category, description: desc, amount, transaction_cost: cost, date: new Date().toISOString() }]);
  };

  if (loading) return <div className="container" style={{ padding: 50 }}>Loading...</div>;

  return (
    <main className={styles.main}>
      <div className="container">
        <header className={styles.header}>
          <Link href="/" className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>← Back</Link>
          <h1>Tracker: {month}/{year}</h1>
        </header>

        <div className={styles.grid}>
          {/* Income Section */}
          <section className={`card ${styles.section}`}>
            <h2>Incomes</h2>
            <div className={styles.incomeList}>
              {incomes.map((inc, i) => (
                <div key={i} className={styles.row}>
                  <span>{inc.source}</span>
                  <span className={styles.money}>+{inc.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className={styles.totalRow}>
              <strong>Total Income</strong>
              <strong>{currentTotalIncome.toLocaleString()}</strong>
            </div>

            <AddIncomeForm onAdd={addIncome} />

            <button onClick={calculateBudget} className="btn" style={{ marginTop: 16, width: '100%' }}>
              {budgetItems.length > 0 ? 'Recalculate Budget' : 'Generate Budget Plan'}
            </button>
          </section>

          {/* Savings Breakdown (Mini Card) */}
          <section className={`card ${styles.section}`}>
            <h2>Savings Split</h2>
            {(() => {
              const totalSavings = currentTotalIncome * 0.15; // fixed 15%
              return (
                <div className={styles.breakdown}>
                  {Object.entries(SAVINGS_SPLIT).map(([key, ratio]) => (
                    <div key={key} className={styles.row}>
                      <span>{key} ({ratio * 100}%)</span>
                      <span>{(totalSavings * ratio).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className={styles.divider} />
                  <div className={styles.row}>
                    <strong>Total</strong>
                    <strong>{totalSavings.toLocaleString()}</strong>
                  </div>
                </div>
              )
            })()}
          </section>

          {/* Main Budget Table */}
          <section className={`card ${styles.wideSection}`}>
            <h2>Budget vs Actual</h2>
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Category</span>
                <span>Budgeted</span>
                <span>Spent</span>
                <span>Remaining</span>
              </div>
              {processedBudget.map(item => {
                const remaining = item.amount - item.actual;
                const isOver = remaining < 0;
                return (
                  <div key={item.category} className={styles.tableRow}>
                    <span>{item.category}</span>
                    <span>{item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span>{item.actual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span style={{ color: isOver ? 'var(--danger)' : 'var(--success)' }}>
                      {remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Add Expense */}
          <section className={`card ${styles.section}`}>
            <h2>Add Expense</h2>
            <AddExpenseForm categories={[...LOCKED_CATEGORIES, ...FLEXIBLE_CATEGORIES]} onAdd={addExpense} />
          </section>
        </div>
      </div>
    </main>
  );
}

function AddIncomeForm({ onAdd }: { onAdd: (s: string, a: number) => void }) {
  const [s, setS] = useState('');
  const [a, setA] = useState('');
  return (
    <div className={styles.formMini}>
      <input placeholder="Source (e.g. Salary)" value={s} onChange={e => setS(e.target.value)} className="input" />
      <input placeholder="Amount" type="number" value={a} onChange={e => setA(e.target.value)} className="input" />
      <button className="btn" onClick={() => { if (s && a) { onAdd(s, parseFloat(a)); setS(''); setA(''); } }}>+</button>
    </div>
  )
}

function AddExpenseForm({ categories, onAdd }: { categories: string[], onAdd: any }) {
  const [cat, setCat] = useState(categories[0]);
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [cost, setCost] = useState('');

  const submit = () => {
    if (amt) {
      onAdd(cat, desc, parseFloat(amt), parseFloat(cost) || 0);
      setDesc(''); setAmt(''); setCost('');
    }
  };

  return (
    <div className={styles.formStack}>
      <select className="input" value={cat} onChange={e => setCat(e.target.value)}>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input className="input" placeholder="Description (Optional)" value={desc} onChange={e => setDesc(e.target.value)} />
      <input className="input" type="number" placeholder="Amount" value={amt} onChange={e => setAmt(e.target.value)} />
      <input className="input" type="number" placeholder="Trans. Cost" value={cost} onChange={e => setCost(e.target.value)} />
      <button className="btn" onClick={submit}>Record Expense</button>
    </div>
  )
}

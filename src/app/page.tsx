'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Function to navigate to current month tracker
  const handleStartTracking = () => {
    const m = currentDate.getMonth() + 1;
    const y = currentDate.getFullYear();
    router.push(`/tracker?month=${m}&year=${y}`);
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Funds <span className={styles.highlight}>Manager</span></h1>
          <p className={styles.subtitle}>Premium Financial Control System</p>
        </div>
      </header>
      
      <section className={styles.dashboard}>
        <div className="container">
          <div className={styles.grid}>
            
            <div className={`card ${styles.actionCard}`} onClick={handleStartTracking}>
              <div className={styles.icon}>📊</div>
              <h2>Track Actions</h2>
              <p>Manage budgets, add incomes, and log daily expenses for this month.</p>
              <button className="btn">Open Tracker</button>
            </div>

            <div className={`card ${styles.actionCard}`}>
               <div className={styles.icon}>📈</div>
               <h2>View Trends</h2>
               <p>Analyze your spending patterns across multiple months.</p>
               {/* Trend View placeholder */}
               <button className="btn btn-outline" disabled>Coming Soon</button>
            </div>
            
             <div className={`card ${styles.actionCard}`}>
               <div className={styles.icon}>🔮</div>
               <h2>Compare</h2>
               <p>Compare actuals against budgets to see where you stand.</p>
               <button className="btn btn-outline" disabled>Coming Soon</button>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}

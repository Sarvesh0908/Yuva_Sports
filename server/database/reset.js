import { db, ensureInitialSetup } from './db.js';

export async function resetDatabase() {
  console.log('Resetting database to clean production state...');
  await db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS committee_members;
    DROP TABLE IF EXISTS cash_reconciliation;
    DROP TABLE IF EXISTS receipts;
    DROP TABLE IF EXISTS income_transactions;
    DROP TABLE IF EXISTS expense_transactions;
    DROP TABLE IF EXISTS donors;
    DROP TABLE IF EXISTS mandal_settings;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS _users_old;
    PRAGMA foreign_keys = ON;
  `);

  await ensureInitialSetup();
  console.log('Database successfully reset to clean production state.');
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});

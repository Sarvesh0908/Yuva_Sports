import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'ganpati_mandal.sqlite');
const sqlite = sqlite3.verbose();

const rawDb = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    // Enable WAL mode for better concurrency
    rawDb.run('PRAGMA journal_mode = WAL;');
    rawDb.run('PRAGMA foreign_keys = ON;');
  }
});

// Promisified DB wrapper
export const db = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      rawDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      rawDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      rawDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  exec: (sql) => {
    return new Promise((resolve, reject) => {
      rawDb.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  close: () => {
    return new Promise((resolve, reject) => {
      rawDb.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export async function initDb() {
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(schemaSql);

    try {
      await db.run('ALTER TABLE mandal_settings ADD COLUMN initial_opening_balance REAL DEFAULT 0');
    } catch (e) {
      // column already exists
    }

    console.log('Database schema verified/initialized successfully.');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

export async function ensureInitialSetup() {
  try {
    await initDb();

    // 1. Ensure Mandal Settings exist
    const mandalCount = await db.get('SELECT COUNT(*) as count FROM mandal_settings');
    if (!mandalCount || mandalCount.count === 0) {
      console.log('Initializing default Mandal Settings...');
      await db.run(`
        INSERT INTO mandal_settings (
          name_mr, name_en, tagline_mr, tagline_en, address_mr, address_en,
          contact_phone, contact_email, registration_no, festival_year,
          arrival_date, visarjan_date, upi_id, upi_name, receipt_prefix, receipt_language
        ) VALUES (
          'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड',
          'Yuva Sports Ganeshostav Mandal, Dattawad',
          'स्थापना: १९८८ | ! नवे पर्व युवा सर्व !',
          'Est: 1988 | Reg. No. -',
          'युवा स्पोर्ट्स चौक, दत्तवाड | ४१६१०७ , महाराष्ट्र |',
          'Yuva Sports Chowk, Dattawad | 416107, Maharashtra |',
          '+91 9699049637',
          'sarveshkharoshe8@gmail.com',
          'MAH/PUNE/1992/F-1024',
          2026,
          '2026-09-14T09:00:00',
          '2026-09-25T18:00:00',
          'sarveshkharoshe8-2@okaxis',
          'Sarvesh Kharoshe',
          'YUVA-2026-',
          'mr'
        )
      `);
    }

    // 2. Ensure Super Admin user exists
    const adminCount = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    if (!adminCount || adminCount.count === 0) {
      const adminName = process.env.ADMIN_NAME || 'सचिन मनगूळे(अध्यक्ष)';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@ganeshmandal.org';
      const adminMobile = process.env.ADMIN_MOBILE || '9699049637';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      await db.run(`
        INSERT INTO users (name, email, mobile, password_hash, role, status)
        VALUES (?, ?, ?, ?, 'admin', 'active')
      `, [adminName, adminEmail, adminMobile, passwordHash]);

      console.log(`Initial Administrator account created: ${adminEmail} / ${adminMobile}`);
    }
  } catch (err) {
    console.error('ensureInitialSetup error:', err);
    throw err;
  }
}

export default db;

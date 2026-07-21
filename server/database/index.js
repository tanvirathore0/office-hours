import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const databaseDirectory = fileURLToPath(new URL('.', import.meta.url));
const db = new Database(`${databaseDirectory}/office-hours.db`);

db.pragma('foreign_keys = ON');
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

export default db;

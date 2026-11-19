import { INITIALIZE_SQL } from '../server/capacity.js';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

export function openLocalDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const sqlite = new DatabaseSync(filename);
  try {
    sqlite.exec('PRAGMA foreign_keys = ON');
    sqlite.exec('CREATE TABLE IF NOT EXISTS record_local_migrations(name TEXT PRIMARY KEY, sha256 TEXT NOT NULL)');
    for (const name of readdirSync(new URL('../migrations/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) {
      const sql = readFileSync(new URL('../migrations/' + name, import.meta.url), 'utf8');
      const hash = createHash('sha256').update(sql).digest('hex');
      const prior = sqlite.prepare('SELECT sha256 FROM record_local_migrations WHERE name = ?').get(name);
      if (prior) { if (prior.sha256 !== hash) throw new Error('Applied migration changed: ' + name); continue; }
      sqlite.exec('BEGIN');
      try {
        sqlite.exec(sql);
        sqlite.prepare('INSERT INTO record_local_migrations VALUES (?, ?)').run(name, hash);
        sqlite.exec('COMMIT');
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
    // Local development only: initialize a bounded aggregate, never reset an existing counter.
    sqlite.prepare(INITIALIZE_SQL).get(67108864,Date.now());
    return { sqlite, prepare(sql) { return { bind(...args) {
      const statement = sqlite.prepare(sql);
      return {
        async first() { return statement.get(...args) ?? null; },
        async all() { return { results: statement.all(...args) }; },
        async run() { return { meta: { changes: statement.run(...args).changes } }; },
      };
    } }; } };
  } catch (error) { sqlite.close(); throw error; }
}

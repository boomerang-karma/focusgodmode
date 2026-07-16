/**
 * SQLite client wrapper — local-first store.
 * Phase 3: add sync layer on top of repositories, not a rewrite.
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';

const DB_NAME = 'avadhan_vidya.db';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const database = await SQLite.openDatabaseAsync(DB_NAME);
    await database.execAsync(SCHEMA_SQL);
    db = database;
    return database;
  })();

  return initPromise;
}

export async function run(
  sql: string,
  params: SQLite.SQLiteBindValue[] = [],
): Promise<SQLite.SQLiteRunResult> {
  const database = await getDb();
  return database.runAsync(sql, params);
}

export async function getFirst<T>(
  sql: string,
  params: SQLite.SQLiteBindValue[] = [],
): Promise<T | null> {
  const database = await getDb();
  return database.getFirstAsync<T>(sql, params);
}

export async function getAll<T>(
  sql: string,
  params: SQLite.SQLiteBindValue[] = [],
): Promise<T[]> {
  const database = await getDb();
  return database.getAllAsync<T>(sql, params);
}

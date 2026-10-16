import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import Database from 'better-sqlite3';

export interface AppConfig {
  absUrl?: string;
  absToken?: string;
  absBooksLibId?: string;
  absPodcastsLibId?: string;
  navidromeUrl?: string;
  navidromeUser?: string;
  navidromePassword?: string;
  sleepTimerDefault?: number; // minutes
  dailyLimitMinutes?: number; // minutes (0 = disabled)
}

export interface StatusLog {
  id: number;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  service: 'abs' | 'navidrome' | 'system';
  message: string;
}

export class DB {
  private db: Database.Database;
  private encryptionKey: Buffer;

  constructor(dbPath?: string) {
    const finalPath =
      dbPath ||
      process.env.DB_PATH ||
      (fs.existsSync('/data') ? '/data/config.sqlite' : path.resolve(process.cwd(), 'data/config.sqlite'));

    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(finalPath);
    this.db.pragma('journal_mode = WAL');

    const appSecret = process.env.APP_SECRET || 'hoerbox-dev-fallback-secret-at-least-32-chars-long!';
    this.encryptionKey = crypto.scryptSync(appSecret, 'hoerbox-secrets-salt-2026', 32);

    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hidden_items (
        id TEXT PRIMARY KEY,
        hidden_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_usage (
        date TEXT PRIMARY KEY,
        seconds_listened INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS auth_attempts (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        failed_count INTEGER NOT NULL DEFAULT 0,
        locked_until INTEGER DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        last_activity INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS status_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        level TEXT NOT NULL,
        service TEXT NOT NULL,
        message TEXT NOT NULL
      );
    `);

    // Ensure single auth_attempts row exists
    const row = this.db.prepare('SELECT id FROM auth_attempts WHERE id = 1').get();
    if (!row) {
      this.db.prepare('INSERT INTO auth_attempts (id, failed_count, locked_until) VALUES (1, 0, NULL)').run();
    }
  }

  // --- Encryption Helpers (AES-256-GCM) ---
  public encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  public decrypt(cipherText: string): string {
    if (!cipherText || !cipherText.includes(':')) return '';
    try {
      const [ivHex, authTagHex, encrypted] = cipherText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '';
    }
  }

  // --- PIN & Auth Management (scrypt) ---
  public hasPin(): boolean {
    const row = this.db.prepare("SELECT value FROM config WHERE key = 'pin_hash'").get() as { value: string } | undefined;
    return !!row && !!row.value;
  }

  public setPin(pin: string): void {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
    const stored = `${salt}:${hash}`;
    this.db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('pin_hash', ?)").run(stored);
  }

  public verifyPin(pin: string): boolean {
    const row = this.db.prepare("SELECT value FROM config WHERE key = 'pin_hash'").get() as { value: string } | undefined;
    if (!row || !row.value) return false;
    const [salt, storedHash] = row.value.split(':');
    if (!salt || !storedHash) return false;
    const computedHash = crypto.scryptSync(pin, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(computedHash, 'hex'));
  }

  // Rate Limiting: 5 attempts -> 5 min lockout (Abschnitt 6)
  public checkLockout(): { isLocked: boolean; remainingSeconds: number } {
    const row = this.db.prepare('SELECT failed_count, locked_until FROM auth_attempts WHERE id = 1').get() as {
      failed_count: number;
      locked_until: number | null;
    };
    if (!row) return { isLocked: false, remainingSeconds: 0 };

    const now = Date.now();
    if (row.locked_until && row.locked_until > now) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((row.locked_until - now) / 1000)
      };
    }

    // Lockout expired
    if (row.locked_until && row.locked_until <= now) {
      this.db.prepare('UPDATE auth_attempts SET failed_count = 0, locked_until = NULL WHERE id = 1').run();
    }

    return { isLocked: false, remainingSeconds: 0 };
  }

  public recordAuthAttempt(success: boolean): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
    const now = Date.now();
    const current = this.db.prepare('SELECT failed_count, locked_until FROM auth_attempts WHERE id = 1').get() as {
      failed_count: number;
      locked_until: number | null;
    };

    if (success) {
      this.db.prepare('UPDATE auth_attempts SET failed_count = 0, locked_until = NULL WHERE id = 1').run();
      return { isLocked: false, remainingSeconds: 0, attemptsLeft: 5 };
    }

    const nextFailed = (current?.failed_count || 0) + 1;
    if (nextFailed >= 5) {
      const lockUntil = now + 5 * 60 * 1000; // 5 Minuten Sperre
      this.db.prepare('UPDATE auth_attempts SET failed_count = ?, locked_until = ? WHERE id = 1').run(nextFailed, lockUntil);
      return { isLocked: true, remainingSeconds: 300, attemptsLeft: 0 };
    }

    this.db.prepare('UPDATE auth_attempts SET failed_count = ?, locked_until = NULL WHERE id = 1').run(nextFailed);
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: Math.max(0, 5 - nextFailed) };
  }

  // Sessions (10 min inactivity timeout)
  public createSession(): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.db.prepare('INSERT INTO sessions (token, created_at, last_activity) VALUES (?, ?, ?)').run(token, now, now);
    return token;
  }

  public validateSession(token: string): boolean {
    if (!token) return false;
    const now = Date.now();
    const maxAgeMs = 10 * 60 * 1000; // 10 Minuten Inaktivität
    const row = this.db.prepare('SELECT token, last_activity FROM sessions WHERE token = ?').get(token) as
      | { token: string; last_activity: number }
      | undefined;

    if (!row) return false;

    if (now - row.last_activity > maxAgeMs) {
      this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return false;
    }

    // Touch session
    this.db.prepare('UPDATE sessions SET last_activity = ? WHERE token = ?').run(now, token);
    return true;
  }

  public destroySession(token: string): void {
    if (token) {
      this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }
  }

  // --- Configuration Management ---
  public getConfig(): AppConfig {
    const rows = this.db.prepare('SELECT key, value FROM config').all() as { key: string; value: string }[];
    const map = new Map<string, string>();
    for (const r of rows) {
      map.set(r.key, r.value);
    }

    return {
      absUrl: map.get('abs_url'),
      absToken: this.decrypt(map.get('abs_token_enc') || ''),
      absBooksLibId: map.get('abs_books_lib_id'),
      absPodcastsLibId: map.get('abs_podcasts_lib_id'),
      navidromeUrl: map.get('navidrome_url'),
      navidromeUser: map.get('navidrome_user'),
      navidromePassword: this.decrypt(map.get('navidrome_password_enc') || ''),
      sleepTimerDefault: map.has('sleep_timer_default') ? Number(map.get('sleep_timer_default')) : 0,
      dailyLimitMinutes: map.has('daily_limit_minutes') ? Number(map.get('daily_limit_minutes')) : 0
    };
  }

  public saveConfig(config: Partial<AppConfig>): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    const txn = this.db.transaction(() => {
      if (config.absUrl !== undefined) stmt.run('abs_url', config.absUrl);
      if (config.absToken !== undefined) stmt.run('abs_token_enc', this.encrypt(config.absToken));
      if (config.absBooksLibId !== undefined) stmt.run('abs_books_lib_id', config.absBooksLibId);
      if (config.absPodcastsLibId !== undefined) stmt.run('abs_podcasts_lib_id', config.absPodcastsLibId);
      if (config.navidromeUrl !== undefined) stmt.run('navidrome_url', config.navidromeUrl);
      if (config.navidromeUser !== undefined) stmt.run('navidrome_user', config.navidromeUser);
      if (config.navidromePassword !== undefined) stmt.run('navidrome_password_enc', this.encrypt(config.navidromePassword));
      if (config.sleepTimerDefault !== undefined) stmt.run('sleep_timer_default', String(config.sleepTimerDefault));
      if (config.dailyLimitMinutes !== undefined) stmt.run('daily_limit_minutes', String(config.dailyLimitMinutes));
    });
    txn();
  }

  // --- Hidden Items Management ---
  public isItemHidden(id: string): boolean {
    const row = this.db.prepare('SELECT id FROM hidden_items WHERE id = ?').get(id);
    return !!row;
  }

  public setItemHidden(id: string, hidden: boolean): void {
    if (hidden) {
      this.db.prepare('INSERT OR IGNORE INTO hidden_items (id, hidden_at) VALUES (?, ?)').run(id, Date.now());
    } else {
      this.db.prepare('DELETE FROM hidden_items WHERE id = ?').run(id);
    }
  }

  public getHiddenItemIds(): string[] {
    const rows = this.db.prepare('SELECT id FROM hidden_items').all() as { id: string }[];
    return rows.map((r) => r.id);
  }

  // --- Daily Usage Management (TZ=Europe/Berlin) ---
  public getTodayDateString(): string {
    const tz = process.env.TZ || 'Europe/Berlin';
    try {
      return new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  public getDailyUsageSeconds(dateStr?: string): number {
    const date = dateStr || this.getTodayDateString();
    const row = this.db.prepare('SELECT seconds_listened FROM daily_usage WHERE date = ?').get(date) as
      | { seconds_listened: number }
      | undefined;
    return row?.seconds_listened || 0;
  }

  public addDailyUsageSeconds(seconds: number, dateStr?: string): number {
    const date = dateStr || this.getTodayDateString();
    this.db
      .prepare(
        `INSERT INTO daily_usage (date, seconds_listened)
         VALUES (?, ?)
         ON CONFLICT(date) DO UPDATE SET seconds_listened = seconds_listened + excluded.seconds_listened`
      )
      .run(date, Math.max(0, Math.round(seconds)));
    return this.getDailyUsageSeconds(date);
  }

  public isDailyLimitReached(): boolean {
    const config = this.getConfig();
    if (!config.dailyLimitMinutes || config.dailyLimitMinutes <= 0) {
      return false;
    }
    const listened = this.getDailyUsageSeconds();
    return listened >= config.dailyLimitMinutes * 60;
  }

  // --- Logging (No secrets!) ---
  public log(level: 'info' | 'warn' | 'error', service: 'abs' | 'navidrome' | 'system', message: string): void {
    this.db
      .prepare('INSERT INTO status_logs (timestamp, level, service, message) VALUES (?, ?, ?, ?)')
      .run(Date.now(), level, service, message);

    // Keep max 200 logs
    this.db
      .prepare(
        `DELETE FROM status_logs WHERE id NOT IN (
          SELECT id FROM status_logs ORDER BY id DESC LIMIT 200
        )`
      )
      .run();
  }

  public getLogs(limit = 100): StatusLog[] {
    return this.db.prepare('SELECT * FROM status_logs ORDER BY id DESC LIMIT ?').all(limit) as StatusLog[];
  }

  // --- Reset All Data ---
  public resetAllData(): void {
    this.db.exec(`
      DELETE FROM config;
      DELETE FROM hidden_items;
      DELETE FROM daily_usage;
      DELETE FROM sessions;
      DELETE FROM status_logs;
      UPDATE auth_attempts SET failed_count = 0, locked_until = NULL WHERE id = 1;
    `);
  }

  public close(): void {
    this.db.close();
  }
}

// Global Singleton instance
let defaultDB: DB | null = null;

export function getDB(): DB {
  if (!defaultDB) {
    defaultDB = new DB();
  }
  return defaultDB;
}

export function setDB(customDb: DB): void {
  defaultDB = customDb;
}

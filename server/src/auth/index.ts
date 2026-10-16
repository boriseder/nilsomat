import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { getDB } from '../db.js';

export const SESSION_COOKIE_NAME = 'hoerbox_session';

export interface AuthState {
  hasPin: boolean;
  isLocked: boolean;
  remainingSeconds: number;
}

export class AuthService {
  public static getAuthState(): AuthState {
    const db = getDB();
    const lockout = db.checkLockout();
    return {
      hasPin: db.hasPin(),
      isLocked: lockout.isLocked,
      remainingSeconds: lockout.remainingSeconds
    };
  }

  public static verifyPin(pin: string): { success: boolean; isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
    const db = getDB();
    const lockout = db.checkLockout();
    if (lockout.isLocked) {
      return {
        success: false,
        isLocked: true,
        remainingSeconds: lockout.remainingSeconds,
        attemptsLeft: 0
      };
    }

    const match = db.verifyPin(pin);
    const result = db.recordAuthAttempt(match);
    return {
      success: match,
      isLocked: result.isLocked,
      remainingSeconds: result.remainingSeconds,
      attemptsLeft: result.attemptsLeft
    };
  }

  public static createSession(c: Context): string {
    const db = getDB();
    const token = db.createSession();
    const isProd = process.env.NODE_ENV === 'production';
    const isHttps = c.req.url.startsWith('https://');

    setCookie(c, SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd || isHttps,
      sameSite: 'Strict',
      path: '/',
      maxAge: 600 // 10 Minuten
    });

    return token;
  }

  public static clearSession(c: Context): void {
    const db = getDB();
    const token = getCookie(c, SESSION_COOKIE_NAME);
    if (token) {
      db.destroySession(token);
    }
    deleteCookie(c, SESSION_COOKIE_NAME, {
      path: '/'
    });
  }

  public static validateSession(c: Context): boolean {
    const db = getDB();
    const token = getCookie(c, SESSION_COOKIE_NAME) || c.req.header('X-Session-Token');
    if (!token) return false;
    return db.validateSession(token);
  }
}

// Hono Middleware zum Schutz der /api/parent/* Routen
export const requireParentAuth: MiddlewareHandler = async (c, next) => {
  const isValid = AuthService.validateSession(c);
  if (!isValid) {
    return c.json({ error: 'Nicht autorisiert' }, 401);
  }
  await next();
};

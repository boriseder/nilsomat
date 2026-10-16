// Auth-Modul: PIN-Hashing, Rate-Limiting, Session-Verwaltung (Abschnitt 6)

export interface AuthState {
  hasPin: boolean;
  lockedUntil: number | null;
}

export class AuthService {
  // Implementierung folgt in Meilenstein 5
}

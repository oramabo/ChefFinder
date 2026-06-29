// Chef session token storage (localStorage), mirroring the admin_token pattern.
// The token is an HMAC-signed session minted by /api/chef/login|register.
const KEY = "chef_token";

export function getChefToken(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setChefToken(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* storage unavailable (SSR/private mode) — ignore */
  }
}

export function clearChefToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function isChefLoggedIn(): boolean {
  return getChefToken().length > 0;
}

export function chefAuthHeaders(): Record<string, string> {
  const token = getChefToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

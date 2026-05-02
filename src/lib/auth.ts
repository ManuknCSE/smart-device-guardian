// Mock JWT auth — replace with real backend
export type User = { id: string; name: string; email: string };

const TOKEN_KEY = "iot_auth_token";
const USER_KEY = "iot_auth_user";

function encodeToken(user: User): string {
  // Simulated JWT (NOT real — for demo only)
  const payload = btoa(JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 3600 * 1000 }));
  return `mock.${payload}.signature`;
}

export const auth = {
  login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || password.length < 6) {
          reject(new Error("Invalid credentials"));
          return;
        }
        const stored = localStorage.getItem(`iot_user_${email}`);
        let user: User;
        if (stored) {
          const data = JSON.parse(stored);
          if (data.password !== password) {
            reject(new Error("Incorrect password"));
            return;
          }
          user = { id: data.id, name: data.name, email: data.email };
        } else {
          user = { id: crypto.randomUUID(), name: email.split("@")[0], email };
        }
        localStorage.setItem(TOKEN_KEY, encodeToken(user));
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        resolve(user);
      }, 500);
    });
  },
  signup(name: string, email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (password.length < 6) {
          reject(new Error("Password must be at least 6 characters"));
          return;
        }
        const user: User = { id: crypto.randomUUID(), name, email };
        localStorage.setItem(`iot_user_${email}`, JSON.stringify({ ...user, password }));
        localStorage.setItem(TOKEN_KEY, encodeToken(user));
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        resolve(user);
      }, 500);
    });
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const u = localStorage.getItem(USER_KEY);
    const t = localStorage.getItem(TOKEN_KEY);
    if (!u || !t) return null;
    try { return JSON.parse(u); } catch { return null; }
  },
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
};

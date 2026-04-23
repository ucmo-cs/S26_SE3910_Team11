import { employeeLogin } from "@/lib/api";

const STORAGE_KEY = "employee_auth_token";
const ROLE_KEY = "employee_auth_role";

export type EmployeeRole = "staff" | "admin";

export async function verifyPassword(password: string): Promise<EmployeeRole | null> {
  try {
    const result = await employeeLogin(password);
    sessionStorage.setItem(STORAGE_KEY, result.token);
    sessionStorage.setItem(ROLE_KEY, result.role);
    return result.role as EmployeeRole;
  } catch {
    return null;
  }
}

export function isEmployeeAuthenticated(): boolean {
  const role = sessionStorage.getItem(ROLE_KEY);
  return role === "staff" || role === "admin";
}

export function getEmployeeRole(): EmployeeRole | null {
  const role = sessionStorage.getItem(ROLE_KEY);
  return role === "staff" || role === "admin" ? (role as EmployeeRole) : null;
}

export function isAdmin(): boolean {
  return sessionStorage.getItem(ROLE_KEY) === "admin";
}

export function logoutEmployee(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

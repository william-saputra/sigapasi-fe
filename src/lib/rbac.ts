import type { CurrentUser } from '@/interfaces/accounts/profile.interface';
import { getLocalStorage, getAuthToken } from './auth';
 
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  TEACHER = 'TEACHER',
  HEAD = 'HEAD'
}
 
/**
 * Retrieves the current user from localStorage.
 * @returns The current user object or null if not found.
 */
export function getCurrentUser(): CurrentUser | null {
  return getLocalStorage<CurrentUser>('user');
}
 
/**
 * Checks if the user is authenticated.
 * @returns True if authenticated, false otherwise.
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user);
}
 
/**
 * Checks if the current user has admin role.
 * @returns True if the user is an admin, false otherwise.
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  const role = user?.role;
  if (!role || typeof role !== 'string') return false;
  return String(role).toUpperCase() === UserRole.ADMIN;
}

export function isTeacher(): boolean {
  const user = getCurrentUser();
  const role = user?.role;
  if (!role || typeof role !== 'string') return false;
  return String(role).toUpperCase() === UserRole.TEACHER;
}

export function isStaff(): boolean {
  const user = getCurrentUser();
  const role = user?.role;
  if (!role || typeof role !== 'string') return false;
  return String(role).toUpperCase() === UserRole.STAFF;
}

export function isHead(): boolean {
  const user = getCurrentUser();
  const role = user?.role;
  if (!role || typeof role !== 'string') return false;
  return String(role).toUpperCase() === UserRole.HEAD;
}
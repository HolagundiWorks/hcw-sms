import type { Role } from './roles';

/** Current signed-in user, normally injected from the PHP session. */
export interface SessionUser {
  name: string;
  role: Role;
  avatarUrl?: string;
  email?: string;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

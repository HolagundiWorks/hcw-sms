// openSIS profiles. The cockpit UI is module-based (not role-nav), but the
// signed-in user still has a profile we label in the utility strip.
export type Role = 'admin' | 'teacher' | 'student' | 'parent';

export const roleLabel: Record<Role, string> = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

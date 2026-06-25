import {
  IconBook2,
  IconCalendarEvent,
  IconChartBar,
  IconClipboardCheck,
  IconHeartHandshake,
  IconId,
  IconLayoutDashboard,
  IconMessages,
  IconReportAnalytics,
  IconSchool,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';
import type { IconComponent } from './icons';
import type { AccentColor } from './theme';

// The four HCW-SMS profiles, kept 1:1 with the legacy app so an embedded page
// can pass the current user's profile straight through.
export type Role = 'admin' | 'teacher' | 'student' | 'parent';

export interface NavItem {
  /** Stable key the PHP side can map to a Modules.php?modname=... URL. */
  key: string;
  label: string;
  icon: IconComponent;
}

export interface RoleConfig {
  label: string;
  /** Pastel accent used for this role's chrome (active nav, avatar ring). */
  accent: AccentColor;
  nav: NavItem[];
}

export const roles: Record<Role, RoleConfig> = {
  admin: {
    label: 'Administrator',
    accent: 'brand',
    nav: [
      { key: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
      { key: 'calendar', label: 'Calendar', icon: IconCalendarEvent },
      { key: 'students', label: 'Students', icon: IconUsers },
      { key: 'staff', label: 'Staff', icon: IconId },
      { key: 'school', label: 'School', icon: IconSchool },
      { key: 'courses', label: 'Courses', icon: IconBook2 },
      { key: 'attendance', label: 'Attendance', icon: IconClipboardCheck },
      { key: 'grades', label: 'Grades', icon: IconChartBar },
      { key: 'reports', label: 'Reports', icon: IconReportAnalytics },
      { key: 'settings', label: 'Settings', icon: IconSettings },
    ],
  },
  teacher: {
    label: 'Teacher',
    accent: 'mint',
    nav: [
      { key: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
      { key: 'calendar', label: 'Calendar', icon: IconCalendarEvent },
      { key: 'classes', label: 'My Classes', icon: IconBook2 },
      { key: 'students', label: 'Students', icon: IconUsers },
      { key: 'attendance', label: 'Attendance', icon: IconClipboardCheck },
      { key: 'gradebook', label: 'Gradebook', icon: IconChartBar },
      { key: 'messages', label: 'Messages', icon: IconMessages },
    ],
  },
  student: {
    label: 'Student',
    accent: 'sky',
    nav: [
      { key: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
      { key: 'calendar', label: 'Calendar', icon: IconCalendarEvent },
      { key: 'courses', label: 'My Courses', icon: IconBook2 },
      { key: 'grades', label: 'My Grades', icon: IconChartBar },
      { key: 'attendance', label: 'Attendance', icon: IconClipboardCheck },
      { key: 'messages', label: 'Messages', icon: IconMessages },
    ],
  },
  parent: {
    label: 'Parent',
    accent: 'lavender',
    nav: [
      { key: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
      { key: 'calendar', label: 'Calendar', icon: IconCalendarEvent },
      { key: 'children', label: 'My Children', icon: IconHeartHandshake },
      { key: 'grades', label: 'Grades', icon: IconChartBar },
      { key: 'attendance', label: 'Attendance', icon: IconClipboardCheck },
      { key: 'messages', label: 'Messages', icon: IconMessages },
    ],
  },
};

export const roleList = Object.keys(roles) as Role[];

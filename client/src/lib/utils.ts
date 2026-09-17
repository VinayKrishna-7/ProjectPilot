import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import { IssuePriority, IssueStatus, IssueType } from '@taskflow/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return 'Unknown';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return 'Unknown';
  return format(d, fmt);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getPriorityColor(priority: IssuePriority): string {
  const colors: Record<IssuePriority, string> = {
    highest: 'text-red-600',
    high: 'text-orange-500',
    medium: 'text-yellow-500',
    low: 'text-blue-400',
    lowest: 'text-gray-400',
  };
  return colors[priority] || 'text-gray-400';
}

export function getPriorityBg(priority: IssuePriority): string {
  const colors: Record<IssuePriority, string> = {
    highest: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    lowest: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return colors[priority] || '';
}

export function getStatusColor(status: IssueStatus): string {
  const colors: Record<IssueStatus, string> = {
    todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  return colors[status] || '';
}

export function getTypeIcon(type: IssueType): string {
  const icons: Record<IssueType, string> = {
    task: '✓',
    bug: '🐛',
    story: '📖',
    epic: '⚡',
  };
  return icons[type] || '✓';
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateProjectKey(name: string): string {
  const words = name.toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'PROJ';
  if (words.length === 1) return words[0].slice(0, 4);
  return words.map((w) => w[0]).join('').slice(0, 5);
}

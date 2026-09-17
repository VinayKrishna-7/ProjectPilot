import { describe, it, expect } from 'vitest';
import {
  getInitials,
  generateProjectKey,
  generateSlug,
  capitalize,
  getPriorityColor,
  getStatusColor,
} from '../lib/utils';

describe('Frontend utility functions', () => {
  it('getInitials extracts two uppercase letters', () => {
    expect(getInitials('Alex Johnson')).toBe('AJ');
    expect(getInitials('Sarah Connor')).toBe('SC');
    expect(getInitials('ProjectPilot')).toBe('P');
  });

  it('generateProjectKey generates concise uppercase key', () => {
    expect(generateProjectKey('ProjectPilot')).toBe('PROJ');
    expect(generateProjectKey('Mobile Application Development')).toBe('MAD');
  });

  it('generateSlug creates URL-friendly slug', () => {
    expect(generateSlug('Acme Corporation 2026!')).toBe('acme-corporation-2026');
    expect(generateSlug('Project Management Suite')).toBe('project-management-suite');
  });

  it('capitalize transforms strings properly', () => {
    expect(capitalize('in_progress')).toBe('In progress');
    expect(capitalize('todo')).toBe('Todo');
  });

  it('getPriorityColor returns correct text classes', () => {
    expect(getPriorityColor('highest')).toBe('text-red-600');
    expect(getPriorityColor('medium')).toBe('text-yellow-500');
  });

  it('getStatusColor returns valid badge classes', () => {
    expect(getStatusColor('done')).toContain('bg-green-100');
  });
});

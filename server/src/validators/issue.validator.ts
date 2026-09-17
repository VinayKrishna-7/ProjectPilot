import { z } from 'zod';

export const createIssueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(10000).optional(),
  type: z.enum(['task', 'bug', 'story', 'epic']).default('task'),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['lowest', 'low', 'medium', 'high', 'highest']).default('medium'),
  assignee: z.string().optional().nullable(),
  labels: z.array(z.string()).default([]),
  sprint: z.string().optional().nullable(),
  boardColumn: z.string().optional().nullable(),
  storyPoints: z.number().min(0).max(100).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
  parentIssue: z.string().optional().nullable(),
});

export const updateIssueSchema = createIssueSchema.partial().extend({
  version: z.number().optional(),
});

export const moveIssueSchema = z.object({
  boardColumn: z.string(),
  position: z.number(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  version: z.number().optional(),
});

export const issueFilterSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  assignee: z.string().optional(),
  reporter: z.string().optional(),
  sprint: z.string().optional(),
  label: z.string().optional(),
  search: z.string().optional(),
  dueDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  boardColumn: z.string().optional(),
  backlog: z.string().optional(),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type MoveIssueInput = z.infer<typeof moveIssueSchema>;

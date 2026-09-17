import { z } from 'zod';

export const createSprintSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateSprintSchema = createSprintSchema.partial();

export const completeSprintSchema = z.object({
  incompleteIssueAction: z.enum(['backlog', 'next_sprint']),
  targetSprintId: z.string().optional(),
});

export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type CompleteSprintInput = z.infer<typeof completeSprintSchema>;

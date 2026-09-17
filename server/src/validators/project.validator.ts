import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  key: z
    .string()
    .min(2, 'Key must be 2-10 characters')
    .max(10)
    .regex(/^[A-Z][A-Z0-9]+$/, 'Key must start with a letter and contain only uppercase letters and numbers')
    .transform((v) => v.toUpperCase()),
  description: z.string().max(1000).optional(),
  lead: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  lead: z.string().optional().nullable(),
  avatar: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'archived']).optional(),
});

export const addProjectMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

export const updateProjectMemberSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;

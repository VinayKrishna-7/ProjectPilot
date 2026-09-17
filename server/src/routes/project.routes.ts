import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth';
import { requireWorkspaceMember } from '../middleware/authorization';
import { requireProjectMember, requireProjectAdmin } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
} from '../validators/project.validator';

const workspaceProjectsRouter = Router({ mergeParams: true });
workspaceProjectsRouter.use(requireAuth);
workspaceProjectsRouter.get('/', requireWorkspaceMember(), getProjects);
workspaceProjectsRouter.post('/', requireWorkspaceMember(), validate(createProjectSchema), createProject);

const projectRouter = Router();
projectRouter.use(requireAuth);
projectRouter.get('/:id', requireProjectMember(), getProject);
projectRouter.patch('/:id', requireProjectAdmin, validate(updateProjectSchema), updateProject);
projectRouter.delete('/:id', deleteProject);
projectRouter.get('/:id/members', requireProjectMember(), getProjectMembers);
projectRouter.post('/:id/members', requireProjectAdmin, validate(addProjectMemberSchema), addProjectMember);
projectRouter.patch('/:id/members/:memberId', requireProjectAdmin, validate(updateProjectMemberSchema), updateProjectMemberRole);
projectRouter.delete('/:id/members/:memberId', requireProjectAdmin, removeProjectMember);

export { workspaceProjectsRouter, projectRouter };

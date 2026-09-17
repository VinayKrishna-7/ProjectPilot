import { Router } from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  inviteWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} from '../controllers/workspace.controller';
import { requireAuth } from '../middleware/auth';
import { requireWorkspaceMember, requireWorkspaceAdmin } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../validators/workspace.validator';

const router = Router();

router.use(requireAuth);

router.get('/', getWorkspaces);
router.post('/', validate(createWorkspaceSchema), createWorkspace);
router.get('/:id', requireWorkspaceMember(), getWorkspace);
router.patch('/:id', requireWorkspaceMember('admin'), validate(updateWorkspaceSchema), updateWorkspace);
router.delete('/:id', requireWorkspaceMember('owner'), deleteWorkspace);

// Members
router.get('/:id/members', requireWorkspaceMember(), getWorkspaceMembers);
router.post('/:id/members', requireWorkspaceAdmin, validate(inviteMemberSchema), inviteWorkspaceMember);
router.patch('/:id/members/:memberId', requireWorkspaceAdmin, validate(updateMemberRoleSchema), updateWorkspaceMemberRole);
router.delete('/:id/members/:memberId', requireWorkspaceAdmin, removeWorkspaceMember);

export default router;

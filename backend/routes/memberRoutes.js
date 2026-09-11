import express from 'express';
import {
  getMembers,
  getActiveMembers,
  getMember,
  createMember,
  updateMember,
  updateMemberStatus,
  deleteMember
} from '../controllers/memberController.js';

const router = express.Router();

// GET all members
router.get('/', getMembers);

// GET active members only
router.get('/active', getActiveMembers);

// GET single member
router.get('/:id', getMember);

// POST create member
router.post('/', createMember);

// PUT update member name
router.put('/:id', updateMember);

// PUT update member status
router.put('/:id/status', updateMemberStatus);

// DELETE member
router.delete('/:id', deleteMember);

export default router;
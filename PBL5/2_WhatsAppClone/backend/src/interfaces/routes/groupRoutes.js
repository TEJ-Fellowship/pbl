import express from 'express';
import {
  createGroupChat,
  getUserGroupChats,
  getGroupDetails,
  addMembersToGroup,
  removeMemberFromGroup,
  sendGroupMessage,
  updateGroupInfo,
} from '../controllers/groupController.js';

const router = express.Router();

// Create a new group
router.post('/create', createGroupChat);

// Get all groups for a user
router.get('/user/:userId', getUserGroupChats);

// Get group details
router.get('/:groupId', getGroupDetails);

// Add members to group
router.post('/:groupId/members', addMembersToGroup);

// Remove member from group
router.delete('/:groupId/members/:userId', removeMemberFromGroup);

// Send message to group
router.post('/:groupId/message', sendGroupMessage);

// Update group info
router.put('/:groupId', updateGroupInfo);

export default router;
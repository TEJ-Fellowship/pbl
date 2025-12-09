import {
  createGroup,
  addGroupMember,
  removeGroupMember,
  getGroupMembers,
  getGroupById,
  getUserGroups,
  updateGroup,
  getGroupConversationId,
} from '../../application/groupService.js';
import { markMessageSent } from '../../application/messageStatusService.js';
import { CassandraRepository } from '../../infrastructure/db/cassandraRepository.js';
import { Conversation } from '../../infrastructure/db/postgresRepository.js';

const messageRepo = new CassandraRepository();

// Create a new group
export const createGroupChat = async (req, res) => {
  try {
    const { groupName, createdBy, description, memberIds } = req.body;

    if (!groupName || !createdBy) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['groupName', 'createdBy'],
      });
    }

    // Create group
    const group = await createGroup(groupName, createdBy, description);

    // Add members if provided
    if (memberIds && Array.isArray(memberIds)) {
      for (const memberId of memberIds) {
        if (memberId !== createdBy) {
          await addGroupMember(group.groupId, memberId);
        }
      }
    }

    res.json({
      message: 'Group created successfully',
      data: group,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all groups for a user
export const getUserGroupChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const groups = await getUserGroups(userId);

    res.json({
      message: 'Groups retrieved successfully',
      userId,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    console.error('Error getting user groups:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get group details
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await getGroupById(groupId);
    const members = await getGroupMembers(groupId);
    const conversationId = await getGroupConversationId(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      message: 'Group details retrieved successfully',
      data: {
        ...group,
        members,
        conversationId,
      },
    });
  } catch (error) {
    console.error('Error getting group details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add members to group
export const addMembersToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        error: 'userIds must be an array',
      });
    }

    for (const userId of userIds) {
      await addGroupMember(groupId, userId);
    }

    res.json({
      message: 'Members added successfully',
      data: { groupId, addedMembers: userIds },
    });
  } catch (error) {
    console.error('Error adding members:', error);
    res.status(500).json({ error: error.message });
  }
};

// Remove member from group
export const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    await removeGroupMember(groupId, userId);

    res.json({
      message: 'Member removed successfully',
      data: { groupId, removedMember: userId },
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId, senderId, content, messageType } = req.body;

    if (!groupId || !senderId || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['groupId', 'senderId', 'content'],
      });
    }

    // Get conversation ID for group
    let conversationId = await getGroupConversationId(groupId);
    
    if (!conversationId) {
      return res.status(404).json({ error: 'Group conversation not found' });
    }

    // Save message in Cassandra
    const savedMessage = await messageRepo.saveMessage({
      conversationId,
      senderId,
      content,
      messageType: messageType || 'text',
      status: 'sent',
    });

    const messageId = savedMessage.messageId.toString();

    // Get all group members (recipients)
    const members = await getGroupMembers(groupId);
    const recipientIds = members
      .map(m => m.user_id)
      .filter(id => id !== senderId); // Exclude sender

    // Mark message as sent for all members
    await markMessageSent(
      messageId,
      conversationId,
      senderId,
      [senderId, ...recipientIds] // Include sender
    );

    // Update conversation metadata
    await Conversation.update(
      {
        last_message_id: messageId,
        last_message_text: content,
        last_message_time: savedMessage.createdAt,
        last_message_sender_id: senderId,
      },
      { where: { conversation_id: conversationId } }
    );

    res.json({
      message: 'Group message sent successfully',
      data: {
        ...savedMessage,
        messageId,
        conversationId,
        groupId,
        recipientCount: recipientIds.length,
      },
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update group info
export const updateGroupInfo = async (req, res) => {
  try {
    const { groupId } = req.params;
    const updates = req.body;

    const updatedGroup = await updateGroup(groupId, updates);

    res.json({
      message: 'Group updated successfully',
      data: updatedGroup,
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: error.message });
  }
};
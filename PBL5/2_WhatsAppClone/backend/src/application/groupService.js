import { sequelize } from '../config/postgres.js';
import { Conversation } from '../infrastructure/db/postgresRepository.js';
import { v4 as uuid } from 'uuid';

// Create a new group
export async function createGroup(groupName, createdBy, description = null) {
  const query = `
    INSERT INTO groups (group_id, group_name, group_description, created_by, created_at, updated_at)
    VALUES (:groupId, :groupName, :description, :createdBy, NOW(), NOW())
    RETURNING *
  `;
  
  const groupId = uuid();
  const [results] = await sequelize.query(query, {
    replacements: { groupId, groupName, description, createdBy },
    type: sequelize.QueryTypes.INSERT,
  });
  
  // Add creator as admin member
  await addGroupMember(groupId, createdBy, 'admin');
  
  // Create conversation for group
  const conversationId = uuid();
  await Conversation.create({
    conversation_id: conversationId,
    conversation_type: 'group',
    group_id: groupId,
    user1_id: createdBy, // Store creator as user1 for compatibility
    user2_id: createdBy, // Store creator as user2 for compatibility
  });
  
  return {
    groupId,
    conversationId,
    groupName,
    createdBy,
    description,
  };
}

// Add member to group
export async function addGroupMember(groupId, userId, role = 'member') {
  const query = `
    INSERT INTO group_members (group_id, user_id, role, joined_at)
    VALUES (:groupId, :userId, :role, NOW())
    ON CONFLICT (group_id, user_id) DO NOTHING
  `;
  
  await sequelize.query(query, {
    replacements: { groupId, userId, role },
    type: sequelize.QueryTypes.INSERT,
  });
}

// Remove member from group
export async function removeGroupMember(groupId, userId) {
  const query = `
    DELETE FROM group_members
    WHERE group_id = :groupId AND user_id = :userId
  `;
  
  await sequelize.query(query, {
    replacements: { groupId, userId },
    type: sequelize.QueryTypes.DELETE,
  });
}

// Get group members
export async function getGroupMembers(groupId) {
  const query = `
    SELECT 
      gm.user_id,
      gm.role,
      gm.joined_at,
      u.name,
      u.phone
    FROM group_members gm
    JOIN users u ON gm.user_id = u.user_id
    WHERE gm.group_id = :groupId
    ORDER BY gm.joined_at ASC
  `;
  
  const results = await sequelize.query(query, {
    replacements: { groupId },
    type: sequelize.QueryTypes.SELECT,
  });
  
  return results;
}

// Get group by ID
export async function getGroupById(groupId) {
  const query = `
    SELECT 
      g.*,
      u.name as creator_name
    FROM groups g
    JOIN users u ON g.created_by = u.user_id
    WHERE g.group_id = :groupId
  `;
  
  const [results] = await sequelize.query(query, {
    replacements: { groupId },
    type: sequelize.QueryTypes.SELECT,
  });
  
  return results;
}

// Get all groups for a user
export async function getUserGroups(userId) {
  const query = `
    SELECT 
      g.*,
      c.conversation_id,
      c.last_message_id,
      c.last_message_text,
      c.last_message_time,
      c.last_message_sender_id
    FROM groups g
    JOIN group_members gm ON g.group_id = gm.group_id
    JOIN conversations c ON g.group_id = c.group_id
    WHERE gm.user_id = :userId
    ORDER BY c.last_message_time DESC NULLS LAST
  `;
  
  const results = await sequelize.query(query, {
    replacements: { userId },
    type: sequelize.QueryTypes.SELECT,
  });
  
  return results;
}

// Update group info
export async function updateGroup(groupId, updates) {
  const allowedFields = ['group_name', 'group_description'];
  const updatesList = [];
  const replacements = { groupId };
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updatesList.push(`${field} = :${field}`);
      replacements[field] = updates[field];
    }
  }
  
  if (updatesList.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  updatesList.push('updated_at = NOW()');
  
  const query = `
    UPDATE groups
    SET ${updatesList.join(', ')}
    WHERE group_id = :groupId
    RETURNING *
  `;
  
  const [results] = await sequelize.query(query, {
    replacements,
    type: sequelize.QueryTypes.UPDATE,
  });
  
  return results;
}

// Get conversation ID for a group
export async function getGroupConversationId(groupId) {
  const conversation = await Conversation.findOne({
    where: { group_id: groupId, conversation_type: 'group' },
  });
  
  return conversation ? conversation.conversation_id : null;
}
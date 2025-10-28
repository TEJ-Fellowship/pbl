import mongoose from "mongoose";

/**
 * MongoDB Transaction Helper
 *
 * This utility provides a safe way to wrap database operations in transactions
 * to prevent race conditions and ensure ACID compliance.
 *
 * Fixes the race condition issue identified in tier 3 analysis.
 */
export async function withTransaction(callback) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Execute callback with session
    const result = await callback(session);

    // Commit if successful
    await session.commitTransaction();
    return result;
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    console.error(
      "[Transaction Error] Rolling back transaction:",
      error.message
    );
    throw error;
  } finally {
    // Always end session
    session.endSession();
  }
}

/**
 * Safe message save with transaction support
 */
export async function saveMessageInTransaction(message, conversation, session) {
  // Save message with session
  await message.save({ session });

  // Add message ID to conversation with session
  await conversation.addMessage(message._id);

  // Save conversation with session
  await conversation.save({ session });

  return message;
}

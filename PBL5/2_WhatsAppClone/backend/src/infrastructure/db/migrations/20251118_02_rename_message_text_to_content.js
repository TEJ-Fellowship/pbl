import { DataTypes } from "sequelize";

export default {
  up: async ({ context: queryInterface }) => {
    // Check if column exists and rename from last_message_text to last_message_content
    // This handles cases where the database was created with the old column name
    try {
      const tableDescription = await queryInterface.describeTable("conversations");
      
      // If old column exists, rename it
      if (tableDescription.last_message_text && !tableDescription.last_message_content) {
        await queryInterface.renameColumn(
          "conversations",
          "last_message_text",
          "last_message_content"
        );
        console.log("Renamed last_message_text to last_message_content");
      } else if (tableDescription.last_message_content) {
        console.log("Column last_message_content already exists, skipping rename");
      }
    } catch (error) {
      // If table doesn't exist or other error, just log it
      console.log("Migration rename skipped:", error.message);
    }
  },
  down: async ({ context: queryInterface }) => {
    // Revert: rename column back from last_message_content to last_message_text
    try {
      const tableDescription = await queryInterface.describeTable("conversations");
      
      if (tableDescription.last_message_content && !tableDescription.last_message_text) {
        await queryInterface.renameColumn(
          "conversations",
          "last_message_content",
          "last_message_text"
        );
      }
    } catch (error) {
      console.log("Migration revert skipped:", error.message);
    }
  },
};


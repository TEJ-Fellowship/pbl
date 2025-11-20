import { DataTypes } from "sequelize";

export default {
  up: async ({ context: queryInterface }) => {
    try {
      const tableDescription = await queryInterface.describeTable("conversations");
      
      // If last_message_content exists but last_message_text doesn't, rename it
      if (tableDescription.last_message_content && !tableDescription.last_message_text) {
        await queryInterface.renameColumn(
          "conversations",
          "last_message_content",
          "last_message_text"
        );
        console.log("✅ Renamed last_message_content to last_message_text");
      } 
      // If neither exists, add last_message_text
      else if (!tableDescription.last_message_text && !tableDescription.last_message_content) {
        await queryInterface.addColumn(
          "conversations",
          "last_message_text",
          {
            type: DataTypes.TEXT,
            allowNull: true,
          }
        );
        console.log("✅ Added last_message_text column");
      }
      // If last_message_text already exists, do nothing
      else if (tableDescription.last_message_text) {
        console.log("✅ Column last_message_text already exists");
      }
    } catch (error) {
      console.error("Error in migration:", error.message);
      throw error;
    }
  },
  down: async ({ context: queryInterface }) => {
    try {
      const tableDescription = await queryInterface.describeTable("conversations");
      
      if (tableDescription.last_message_text && !tableDescription.last_message_content) {
        await queryInterface.renameColumn(
          "conversations",
          "last_message_text",
          "last_message_content"
        );
      }
    } catch (error) {
      console.log("Migration revert skipped:", error.message);
    }
  },
};


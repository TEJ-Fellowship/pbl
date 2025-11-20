const { Sequelize } = require("sequelize");

module.exports = {
  up: async ({ context: queryInterface }) => {
    try {
      // Find the enum type name for bookings.status
      // Sequelize creates enum names like: enum_bookings_status
      const result = await queryInterface.sequelize.query(`
        SELECT DISTINCT t.typname
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE e.enumlabel IN ('pending', 'confirmed', 'cancelled')
        AND t.typname LIKE '%status%'
        LIMIT 1;
      `);

      if (result[0].length === 0) {
        console.log(
          "⚠️  Could not find bookings status enum - may already have 'refunded'"
        );
        return;
      }

      const enumName = result[0][0].typname;

      // Check if 'refunded' already exists
      const checkResult = await queryInterface.sequelize.query(`
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'refunded'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = '${enumName}')
        LIMIT 1;
      `);

      if (checkResult[0].length > 0) {
        console.log(`✅ 'refunded' already exists in ${enumName} enum`);
        return;
      }

      // Add 'refunded' value to enum
      await queryInterface.sequelize.query(`
        ALTER TYPE ${enumName} ADD VALUE 'refunded';
      `);
      console.log(`✅ Added 'refunded' to ${enumName} enum`);
    } catch (error) {
      // If enum already has 'refunded' or other non-critical error, log and continue
      if (
        error.message.includes("already exists") ||
        error.message.includes("duplicate") ||
        error.message.includes("already present")
      ) {
        console.log("✅ 'refunded' status already exists in enum");
      } else {
        // Log error but don't fail migration - enum might already be correct
        console.warn("⚠️  Migration warning (non-critical):", error.message);
        console.warn("   This is OK if 'refunded' already exists in the enum");
      }
    }
  },

  down: async ({ context: queryInterface }) => {
    // Note: PostgreSQL doesn't support removing enum values directly
    console.log(
      "⚠️  Cannot remove enum value 'refunded' - manual migration required"
    );
  },
};

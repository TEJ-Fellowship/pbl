const { Sequelize } = require("sequelize");

module.exports = {
  up: async ({ context: queryInterface }) => {
    // Enable UUID extension
    await queryInterface.sequelize.query(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    );

    // Payment table
    await queryInterface.createTable("payments", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "bookings",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM("credit_card", "debit_card", "eSewa", "Khalti"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "processing",
          "success",
          "failed",
          "refunded"
        ),
        defaultValue: "pending",
      },
      transaction_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      idempotency_key: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add unique constraint for payments (one payment per booking)
    await queryInterface.addConstraint("payments", {
      fields: ["booking_id"],
      type: "unique",
      name: "payments_booking_id_unique",
    });

    // Add check constraint for payments amount
    await queryInterface.sequelize.query(`
      ALTER TABLE payments ADD CONSTRAINT payments_amount_check 
      CHECK (amount >= 0);
    `);

    // ============================================
    // INDEXES FOR PERFORMANCE
    // ============================================
    await queryInterface.addIndex("payments", ["booking_id"], {
      name: "idx_payments_booking_id",
    });

    await queryInterface.addIndex("payments", ["idempotency_key"], {
      unique: true,
      name: "idx_payments_idempotency_key",
    });

    await queryInterface.addIndex("payments", ["transaction_id"], {
      name: "idx_payments_transaction_id",
    });

    await queryInterface.addIndex("payments", ["status"], {
      name: "idx_payments_status",
    });

    await queryInterface.addIndex("payments", ["processed_at"], {
      name: "idx_payments_processed_at",
    });

    // Apply updated_at trigger
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
    `);
    await queryInterface.dropTable("payments");
  },
};

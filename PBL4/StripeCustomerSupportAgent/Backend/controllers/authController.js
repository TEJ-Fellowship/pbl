import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../middleware/auth.js";

/**
 * Register a new user
 */
export const register = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { name, email, password, anonymousUserId } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Name, email, and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email",
        message: "Please provide a valid email address",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Weak password",
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "User exists",
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, created_at`,
      [name, email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    // Migrate anonymous sessions if anonymousUserId provided
    let migratedSessions = 0;
    if (anonymousUserId) {
      try {
        console.log(
          `🔄 Migrating sessions from anonymous user ${anonymousUserId} to ${user.id}`
        );

        // Update conversation_sessions
        // Find sessions where user_id IS NULL and metadata contains the anonymousUserId
        const sessionsResult = await client.query(
          `UPDATE conversation_sessions 
           SET user_id = $1, updated_at = NOW(),
               metadata = jsonb_set(metadata, '{anonymousUserId}', 'null'::jsonb, true)
           WHERE user_id IS NULL 
             AND metadata->>'anonymousUserId' = $2
           RETURNING session_id`,
          [user.id, anonymousUserId]
        );

        migratedSessions = sessionsResult.rowCount;

        // Also update any other user-specific tables if they exist
        // For now, just conversation_sessions is migrated

        if (migratedSessions > 0) {
          console.log(
            `✅ Migrated ${migratedSessions} sessions to new user account`
          );
        } else {
          console.log(`ℹ️ No sessions found for anonymous user to migrate`);
        }
      } catch (migrationError) {
        console.error("⚠️ Session migration error:", migrationError);
        // Don't fail registration if migration fails
        // Continue with user creation
      }
    }

    await client.query("COMMIT");

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log registration
    console.log(`✅ New user registered: ${email}`);
    if (migratedSessions > 0) {
      console.log(`   📦 ${migratedSessions} session(s) migrated`);
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at,
        },
        token,
        refreshToken,
        migrated: migratedSessions > 0,
        migratedSessions,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed",
      message: "An error occurred during registration",
    });
  } finally {
    client.release();
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing credentials",
        message: "Email and password are required",
      });
    }

    // Find user
    const result = await client.query(
      "SELECT id, name, email, password_hash, is_active FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: "Account inactive",
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login
    await client.query("UPDATE users SET updated_at = NOW() WHERE id = $1", [
      user.id,
    ]);

    // Log login
    console.log(`✅ User logged in: ${email}`);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: "An error occurred during login",
    });
  } finally {
    client.release();
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (req, res) => {
  const client = await pool.connect();

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Missing token",
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user
    const result = await client.query(
      "SELECT id, name, email, is_active FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "User account no longer exists",
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: "Account inactive",
        message: "Your account has been deactivated",
      });
    }

    // Generate new token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid token",
      message: "Could not refresh token",
    });
  } finally {
    client.release();
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;

    // Get user with statistics
    const result = await client.query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.stripe_customer_id,
        u.created_at,
        u.updated_at,
        COALESCE(s.total_sessions, 0) as total_sessions,
        COALESCE(s.total_messages, 0) as total_messages,
        COALESCE(s.total_tokens_used, 0) as total_tokens_used,
        s.last_activity
       FROM users u
       LEFT JOIN user_statistics s ON s.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "User profile not found",
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          stripeCustomerId: user.stripe_customer_id,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          statistics: {
            totalSessions: parseInt(user.total_sessions),
            totalMessages: parseInt(user.total_messages),
            totalTokensUsed: parseInt(user.total_tokens_used),
            lastActivity: user.last_activity,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get profile",
      message: "An error occurred while fetching profile",
    });
  } finally {
    client.release();
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({
        success: false,
        error: "No updates provided",
        message: "Please provide name or email to update",
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (email) {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email",
          message: "Please provide a valid email address",
        });
      }

      // Check if email is already taken
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email.toLowerCase(), userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: "Email taken",
          message: "This email is already in use",
        });
      }

      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase());
    }

    values.push(userId);

    // Update user
    const result = await client.query(
      `UPDATE users 
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, name, email, updated_at`,
      values
    );

    const user = result.rows[0];

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          updatedAt: user.updated_at,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
      message: "An error occurred while updating profile",
    });
  } finally {
    client.release();
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Missing passwords",
        message: "Current and new passwords are required",
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Weak password",
        message: "New password must be at least 6 characters long",
      });
    }

    // Get user
    const result = await client.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "User not found",
      });
    }

    const user = result.rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid password",
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await client.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
      message: "An error occurred while changing password",
    });
  } finally {
    client.release();
  }
};

/**
 * Delete account
 */
export const deleteAccount = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password required",
        message: "Please provide your password to confirm deletion",
      });
    }

    // Get user
    const result = await client.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "User not found",
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid password",
        message: "Password is incorrect",
      });
    }

    // Delete user (CASCADE will delete related data)
    await client.query("DELETE FROM users WHERE id = $1", [userId]);

    console.log(`✅ User account deleted: ${userId}`);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete account",
      message: "An error occurred while deleting account",
    });
  } finally {
    client.release();
  }
};

export default {
  register,
  login,
  refreshAccessToken,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};

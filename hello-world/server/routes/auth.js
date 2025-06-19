import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import Invite from "../models/Invite.js";
import passport from "../middleware/passport.js";
import {
  authenticateToken,
  requireRole,
  requirePermission,
} from "../middleware/auth.js";

const router = express.Router();

// Rate limiting for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    message: "Too many authentication attempts, please try again later.",
  },
});

const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 invites per hour
  message: { message: "Too many invites sent, please try again later." },
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Send invitation email
const sendInviteEmail = async (email, token, inviterName, role, cohort) => {
  const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Invitation to TEJ Bootcamp Showcase",
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #EF564E, #FF6B6B); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to TEJ Bootcamp!</h1>
        </div>
        
        <div style="background: white; padding: 40px 20px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">You've been invited!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join the TEJ Bootcamp Project Showcase as a <strong>${role}</strong> 
            in the <strong>${cohort}</strong> cohort.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Connect with your GitHub account to showcase your projects, get feedback from peers, and celebrate your coding journey!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background: #EF564E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Accept Invitation via GitHub
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center;">
            This invitation expires in 7 days.
          </p>
          
          <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you're having trouble with the button above, copy and paste this URL into your browser:<br>
              <span style="color: #666;">${inviteUrl}</span>
            </p>
          </div>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// GitHub OAuth initiation
router.get("/github", (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(501).json({
      message: "GitHub OAuth not configured on this server",
    });
  }

  const { invite_token } = req.query;

  // Pass invite token as state to GitHub OAuth
  passport.authenticate("github", {
    scope: ["user:email"],
    state: invite_token,
  })(req, res, next);
});

// GitHub OAuth callback
router.get(
  "/github/callback",
  (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return res.status(501).json({
        message: "GitHub OAuth not configured on this server",
      });
    }

    passport.authenticate("github", { session: false })(req, res, next);
  },
  async (req, res) => {
    try {
      const userData = req.user;

      // If user already exists, generate token and redirect
      if (userData._id) {
        const token = generateToken(userData._id);
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/success?token=${token}`
        );
      }

      // New user registration - validate invite
      if (!userData.inviteToken) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?message=invitation_required`
        );
      }

      const invite = await Invite.findValidInvite(userData.inviteToken);
      if (!invite) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?message=invalid_invite`
        );
      }

      // Check if email matches invite
      if (userData.email !== invite.email) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/error?message=email_mismatch&expected=${invite.email}`
        );
      }

      // Create new user
      const user = new User({
        githubId: userData.githubId,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        githubData: userData.githubData,
        role: invite.role,
        cohort: invite.cohort,
        invitedBy: invite.invitedBy,
        invitedAt: invite.createdAt,
        status: "active",
        permissions: User.getRolePermissions(invite.role),
      });

      await user.save();
      await user.updateLastLogin();
      await invite.accept();

      const token = generateToken(user._id);
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/success?token=${token}&firstLogin=true`
      );
    } catch (error) {
      console.error("GitHub callback error:", error);
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?message=server_error`
      );
    }
  }
);

// Send invitation
router.post(
  "/invite",
  authLimiter,
  inviteLimiter,
  authenticateToken,
  requirePermission("invite_student"),
  async (req, res) => {
    try {
      const { email, role, cohort } = req.body;

      // Validate input
      if (!email || !role || !cohort) {
        return res
          .status(400)
          .json({ message: "Email, role, and cohort are required" });
      }

      // Check if user can invite this role
      const canInviteRoles = {
        instructor: ["student", "mentor"],
        admin: ["student", "mentor", "instructor"],
      };

      if (!canInviteRoles[req.user.role]?.includes(role)) {
        return res.status(403).json({
          message: `You cannot invite users with role: ${role}`,
          allowedRoles: canInviteRoles[req.user.role] || [],
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      // Check if there's already a pending invite
      const existingInvite = await Invite.findOne({
        email,
        status: "pending",
        expiresAt: { $gt: new Date() },
      });

      if (existingInvite) {
        return res
          .status(400)
          .json({
            message: "Pending invitation already exists for this email",
          });
      }

      // Create new invite
      const invite = new Invite({
        email,
        role,
        cohort,
        invitedBy: req.user._id,
      });

      await invite.save();

      // Send invitation email
      await sendInviteEmail(email, invite.token, req.user.name, role, cohort);

      res.status(201).json({
        message: "Invitation sent successfully",
        invite: {
          id: invite._id,
          email: invite.email,
          role: invite.role,
          cohort: invite.cohort,
          expiresAt: invite.expiresAt,
        },
      });
    } catch (error) {
      console.error("Invite error:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  }
);

// Verify invite token
router.post("/verify-invite", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const invite = await Invite.findValidInvite(token);
    if (!invite) {
      return res.status(400).json({ message: "Invalid or expired invitation" });
    }

    res.json({
      valid: true,
      invite: {
        email: invite.email,
        role: invite.role,
        cohort: invite.cohort,
        inviterName: invite.invitedBy.name,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("Verify invite error:", error);
    res.status(500).json({ message: "Failed to verify invitation" });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-__v")
      .populate("invitedBy", "name email role");

    res.json({
      user: {
        id: user._id,
        githubId: user.githubId,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        cohort: user.cohort,
        permissions: user.permissions,
        invitedBy: user.invitedBy,
        lastLogin: user.lastLogin,
        githubData: user.githubData,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user data" });
  }
});

// Logout (client-side will remove token)
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Get all users (admin/instructor only)
router.get(
  "/users",
  authenticateToken,
  requireRole(["admin", "instructor"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, role, cohort, status } = req.query;

      const filter = {};
      if (role) filter.role = role;
      if (cohort) filter.cohort = cohort;
      if (status) filter.status = status;

      const users = await User.find(filter)
        .select("-__v -githubData")
        .populate("invitedBy", "name email")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(filter);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  }
);

// Get all invites (admin/instructor only)
router.get(
  "/invites",
  authenticateToken,
  requireRole(["admin", "instructor"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const filter = {};
      if (status) filter.status = status;

      const invites = await Invite.find(filter)
        .populate("invitedBy", "name email role")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Invite.countDocuments(filter);

      res.json({
        invites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get invites error:", error);
      res.status(500).json({ message: "Failed to get invites" });
    }
  }
);

export default router;

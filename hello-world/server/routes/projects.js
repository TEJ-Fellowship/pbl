import express from "express";
import Project from "../models/Project.js";
import { authenticateToken, requirePermission } from "../middleware/auth.js";

const router = express.Router();

// Get all projects
router.get("/", authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate({
        path: "collaborators.userId",
        select: "name avatar email role",
        model: "User",
      })
      .sort({ createdAt: -1 });

    // Transform the data to match the expected format
    const transformedProjects = projects.map((project) => {
      const { _doc } = project;
      return {
        ..._doc,
        collaborators: _doc.collaborators.map((collaborator) => ({
          ...collaborator._doc,
          user: collaborator.userId,
        })),
      };
    });

    res.json(transformedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create a project
router.post("/", authenticateToken, async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      createdBy: req.user.id,
    });

    const savedProject = await project.save();
    const populatedProject = await Project.findById(savedProject._id).populate({
      path: "collaborators.userId",
      select: "name avatar email role",
      model: "User",
    });

    // Transform the response to match the expected format
    const { _doc } = populatedProject;
    const transformedProject = {
      ..._doc,
      collaborators: _doc.collaborators.map((collaborator) => ({
        ...collaborator._doc,
        user: collaborator.userId,
      })),
    };

    res.status(201).json(transformedProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update project collaborators
router.patch(
  "/:id/collaborators",
  authenticateToken,
  requirePermission("manage_collaborators"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { collaborators } = req.body;

      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is the creator or an existing collaborator
      const isCreator = project.createdBy.equals(req.user._id);
      const isCollaborator = project.collaborators.some((c) =>
        c.userId.equals(req.user._id)
      );

      if (!isCreator && !isCollaborator) {
        return res.status(403).json({
          message:
            "You don't have permission to modify this project's collaborators",
        });
      }

      project.collaborators = collaborators;
      await project.save();

      const updatedProject = await Project.findById(id)
        .populate("collaborators.userId", "name email role")
        .populate("createdBy", "name email role");

      res.json(updatedProject);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;

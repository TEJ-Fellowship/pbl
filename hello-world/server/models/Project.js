import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  githubUrl: {
    type: String,
    required: true,
  },
  liveUrl: {
    type: String,
  },
  technologies: [
    {
      type: String,
      required: true,
    },
  ],
  screenshots: [
    {
      type: String,
    },
  ],
  collaborators: [
    {
      name: String,
      githubUsername: String,
      role: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Project", projectSchema);

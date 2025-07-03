const express = require("express");
const {
  customizeResume,
  saveCustomizedResume,
  getSavedVersions,
  getSavedVersion,
  deleteSavedVersion,
} = require("../controllers/customizationController");

const customizationRouter = express.Router();

// Customization routes
customizationRouter.post("/:resumeId", customizeResume);
customizationRouter.post("/:resumeId/save", saveCustomizedResume);
customizationRouter.get("/:resumeId/versions", getSavedVersions);
customizationRouter.get("/:resumeId/versions/:versionId", getSavedVersion);
customizationRouter.delete(
  "/:resumeId/versions/:versionId",
  deleteSavedVersion
);

module.exports = customizationRouter;

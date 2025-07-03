const CustomizationService = require("../services/customizationService");
const { asyncHandler } = require("../utils/asyncHandler");

// Customize resume for specific job
const customizeResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const jobDetails = req.body;

  console.log("=== CUSTOMIZATION DEBUG ===");
  console.log("Resume ID:", resumeId);
  console.log("Job Details:", jobDetails);

  const customization = await CustomizationService.customizeResume(
    resumeId,
    jobDetails
  );

  console.log("Customization completed:", customization);

  res.json({
    success: true,
    message: "Resume customized successfully",
    data: customization,
  });
});

// Save customized resume version
const saveCustomizedResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const { jobDetails, customizedResume } = req.body;

  const savedVersion = await CustomizationService.saveCustomizedResume(
    resumeId,
    jobDetails,
    customizedResume
  );

  res.json({
    success: true,
    message: "Customized resume saved successfully",
    data: savedVersion,
  });
});

// Get all saved versions for a resume
const getSavedVersions = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;

  const versions = await CustomizationService.getSavedVersions(resumeId);

  res.json({
    success: true,
    message: "Saved versions retrieved successfully",
    data: versions,
  });
});

// Get specific saved version
const getSavedVersion = asyncHandler(async (req, res) => {
  const { resumeId, versionId } = req.params;

  const version = await CustomizationService.getSavedVersion(
    resumeId,
    versionId
  );

  if (!version) {
    return res.status(404).json({
      success: false,
      message: "Customized resume version not found",
    });
  }

  res.json({
    success: true,
    message: "Customized resume version retrieved successfully",
    data: version,
  });
});

// Delete saved version
const deleteSavedVersion = asyncHandler(async (req, res) => {
  const { resumeId, versionId } = req.params;

  const deletedVersion = await CustomizationService.deleteSavedVersion(
    resumeId,
    versionId
  );

  if (!deletedVersion) {
    return res.status(404).json({
      success: false,
      message: "Customized resume version not found",
    });
  }

  res.json({
    success: true,
    message: "Customized resume version deleted successfully",
  });
});

module.exports = {
  customizeResume,
  saveCustomizedResume,
  getSavedVersions,
  getSavedVersion,
  deleteSavedVersion,
};

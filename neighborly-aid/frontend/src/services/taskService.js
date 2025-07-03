import { createTask, getTasks, getUserTasks } from "../api/tasks";

// Fetch all tasks (for Help Others tab)
export const fetchAllTasks = async (filters = {}) => {
  try {
    const tasks = await getTasks(filters);
    return tasks.map(transformTaskForDisplay);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

// Fetch user's own tasks (for Ask for Help tab)
export const fetchUserTasks = async () => {
  try {
    const tasks = await getUserTasks("created");
    return tasks.map((task) => ({
      ...transformTaskForDisplay(task),
      isUserTask: true,
      user: "You",
    }));
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    throw error;
  }
};

export const submitTaskAction = async (formData) => {
  try {
    // Convert FormData to regular object
    const taskData = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      urgency: formData.get("urgency"),
      location: formData.get("location"),
      taskKarmaPoints: parseInt(formData.get("karmaPoints")) || 10,
    };

    console.log("Submitting task data:", taskData);

    // Call the API to create the task
    const response = await createTask(taskData);

    console.log("Task created successfully:", response);

    return { success: true, data: response };
  } catch (error) {
    console.error("Task submission error:", error);

    // Handle different types of errors
    if (error.error) {
      throw new Error(error.error);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error("Failed to create task. Please try again.");
    }
  }
};

// Transform database task to component format
export const transformTaskForDisplay = (dbTask) => {
  // Handle category - could be populated object or string (for backward compatibility)
  let categoryDisplay = "Other";
  let categoryId = null;

  if (dbTask.category) {
    if (typeof dbTask.category === "object" && dbTask.category.displayName) {
      // New populated category object
      categoryDisplay = dbTask.category.displayName;
      categoryId = dbTask.category._id;
    } else if (typeof dbTask.category === "string") {
      // Legacy string category or ObjectId
      categoryDisplay = dbTask.category;
      categoryId = dbTask.category;
    }
  }

  return {
    id: dbTask._id,
    _id: dbTask._id, // Keep both for compatibility
    user: dbTask.createdBy?.name || "Unknown User",
    avatar: "👤", // Default avatar, you can customize this based on user data
    time: formatTimeAgo(dbTask.createdAt),
    category: categoryDisplay, // Display name for UI
    categoryId: categoryId, // ID for filtering/operations
    categoryData: dbTask.category, // Full category object if available
    urgency: dbTask.urgency,
    title: dbTask.title,
    description: dbTask.description,
    location: dbTask.location || "Location not specified",
    likes: dbTask.likes || 0,
    likedBy: dbTask.likedBy || [],
    comments: 0, // This might need to be added to your schema later
    helpers: dbTask.helpers || [],
    karma: dbTask.taskKarmaPoints || 0,
    status: dbTask.status?.toLowerCase() || "open",
    isUserTask: false, // Will be set based on context
    createdBy: dbTask.createdBy, // Include full creator info for like validation
  };
};

// Helper function to format time ago
const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now - date;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// frontend/src/api/tasks.js
import axios from "axios";
import config from "../config/config";

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
  try {
    // console.log("Creating task with data:", taskData);
    // console.log("API URL:", `${config.API_BASE_URL}/api/tasks`);

    const response = await axios.post(
      `${config.API_BASE_URL}/api/tasks`,
      taskData,
      {
        withCredentials: true, // This ensures cookies are sent
      }
    );
    return response.data;
  } catch (error) {
    console.error("Create task error:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    console.error("Request headers that were sent:", error.config?.headers);
    throw error.response?.data || { error: "Failed to create task" };
  }
};

/**
 * Get all tasks with optional filters
 * @param {Object} filters - Optional filters (category, status, etc.)
 * @returns {Promise<Array>} Array of tasks
 */
export const getTasks = async (filters = {}) => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/api/tasks`, {
      params: filters,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Get tasks error:", error);
    throw error.response?.data || { error: "Failed to fetch tasks" };
  }
};

/**
 * Get user's own tasks
 * @param {string} type - 'created' or 'accepted'
 * @returns {Promise<Array>} Array of user's tasks
 */
export const getUserTasks = async (type = "created") => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/api/tasks/my-tasks`,
      {
        params: { type },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get user tasks error:", error);
    throw error.response?.data || { error: "Failed to fetch user tasks" };
  }
};

/**
 * Get task by ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Task data
 */
export const getTaskById = async (taskId) => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/api/tasks/${taskId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get task by ID error:", error);
    throw error.response?.data || { error: "Failed to fetch task" };
  }
};

/**
 * Update task
 * @param {string} taskId - Task ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated task data
 */
export const updateTask = async (taskId, updateData) => {
  try {
    const response = await axios.put(
      `${config.API_BASE_URL}/api/tasks/${taskId}`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Update task error:", error);
    throw error.response?.data || { error: "Failed to update task" };
  }
};

/**
 * Delete task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Success message
 */
export const deleteTask = async (taskId) => {
  try {
    const response = await axios.delete(
      `${config.API_BASE_URL}/api/tasks/${taskId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete task error:", error);
    throw error.response?.data || { error: "Failed to delete task" };
  }
};

/**
 * Cancel task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Success message with refunded karma
 */
export const cancelTask = async (taskId) => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/tasks/${taskId}/cancel`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Cancel task error:", error);
    throw error.response?.data || { error: "Failed to cancel task" };
  }
};

/**
 * Like/Unlike a task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated task data and like status
 */
export const likeTask = async (taskId) => {
  try {
    // console.log("Liking task:", taskId);
    const response = await axios.post(
      `${config.API_BASE_URL}/api/tasks/${taskId}/like`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Like task error:", error);
    throw error.response?.data || { error: "Failed to like task" };
  }
};

export const acceptTask = async (taskId) => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/tasks/${taskId}/accept`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Accept task error:", error);
    throw error.response?.data || { error: "Failed to accept task" };
  }
};

export const removeHelp = async (taskId) => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/tasks/${taskId}/remove-help`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Remove help error:", error);
    throw error.response?.data || { error: "Failed to remove help" };
  }
};

export const getTaskWithHelpers = async (taskId) => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/api/tasks/${taskId}/helpers`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Get task with helpers error:", error);
    throw error.response?.data || { error: "Failed to fetch task helpers" };
  }
};

export const selectHelper = async (taskId, helperId) => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/tasks/${taskId}/select-helper/${helperId}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Select helper error:", error);
    throw error.response?.data || { error: "Failed to select helper" };
  }
};

export const getUserRecentCategories = async (limit = 5) => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/api/tasks/categories/recent`,
      {
        params: { limit },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get user recent categories error:", error);
    throw (
      error.response?.data || { error: "Failed to fetch recent categories" }
    );
  }
};

/**
 * Get category statistics
 * @param {string} userId - Optional user ID for personalized statistics
 * @returns {Promise<Object>} Category statistics with usage data
 */
export const getCategoryStatistics = async (userId = null) => {
  try {
    const params = userId ? { userId } : {};
    const response = await axios.get(
      `${config.API_BASE_URL}/api/tasks/categories/statistics`,
      {
        params,
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get category statistics error:", error);
    throw (
      error.response?.data || { error: "Failed to fetch category statistics" }
    );
  }
};

export const markTaskAsCompletedByHelper = async (taskId) => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/tasks/${taskId}/helper-complete`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Helper complete task error:", error);
    throw error.response?.data || { error: "Failed to mark task as completed" };
  }
};

export const approveTaskCompletion = async (taskId, approved, notes = "") => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/tasks/${taskId}/approve-completion`,
      { approved, notes },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Approve completion error:", error);
    throw (
      error.response?.data || { error: "Failed to approve task completion" }
    );
  }
};

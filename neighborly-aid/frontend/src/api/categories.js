// frontend/src/api/categories.js
import axios from "axios";
import config from "../config/config";

/**
 * Get all active categories
 * @param {boolean} includeInactive - Whether to include inactive categories
 * @returns {Promise<Array>} Array of categories
 */
export const getCategories = async (includeInactive = false) => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/api/categories`, {
      params: { includeInactive },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Get categories error:", error);
    throw error.response?.data || { error: "Failed to fetch categories" };
  }
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Category data
 */
export const getCategoryById = async (categoryId) => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/api/categories/${categoryId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get category by ID error:", error);
    throw error.response?.data || { error: "Failed to fetch category" };
  }
};

/**
 * Create new category
 * @param {Object} categoryData - Category data
 * @returns {Promise<Object>} Created category
 */
export const createCategory = async (categoryData) => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/categories`,
      categoryData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Create category error:", error);
    throw error.response?.data || { error: "Failed to create category" };
  }
};

/**
 * Update category
 * @param {string} categoryId - Category ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated category
 */
export const updateCategory = async (categoryId, updateData) => {
  try {
    const response = await axios.put(
      `${config.API_BASE_URL}/api/categories/${categoryId}`,
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
    console.error("Update category error:", error);
    throw error.response?.data || { error: "Failed to update category" };
  }
};

/**
 * Delete category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteCategory = async (categoryId) => {
  try {
    const response = await axios.delete(
      `${config.API_BASE_URL}/api/categories/${categoryId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete category error:", error);
    throw error.response?.data || { error: "Failed to delete category" };
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
      `${config.API_BASE_URL}/api/categories/statistics`,
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

/**
 * Seed default categories (admin function)
 * @returns {Promise<Object>} Seed result
 */
export const seedCategories = async () => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/categories/seed`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Seed categories error:", error);
    throw error.response?.data || { error: "Failed to seed categories" };
  }
};

/**
 * Migrate legacy categories (admin function)
 * @returns {Promise<Object>} Migration result
 */
export const migrateCategories = async () => {
  try {
    const response = await axios.post(
      `${config.API_BASE_URL}/api/categories/migrate`,
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Migrate categories error:", error);
    throw error.response?.data || { error: "Failed to migrate categories" };
  }
};

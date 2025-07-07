// frontend/src/hooks/useCategories.js
import { useState, useEffect, useContext } from "react";
import {
  getCategories,
  getCategoryStatistics,
  createCategory,
} from "../api/categories";
import { getUserRecentCategories } from "../api/tasks";
import AuthContext from "../context/AuthContext";

export const useCategories = () => {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentCategories, setRecentCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories from database
      const categoriesResponse = await getCategories();

      // Add "All Tasks" option to the beginning
      const categoriesWithAll = [
        {
          _id: "all",
          name: "all",
          displayName: "All Tasks",
          icon: "🏠",
          count: 0,
          hasBeenUsed: true,
          isActive: true,
          sortOrder: -1,
        },
        ...categoriesResponse,
      ];

      setCategories(categoriesWithAll);

      // Fetch category statistics if we want to show usage counts
      try {
        const statsResponse = await getCategoryStatistics();

        // Update categories with statistics
        const categoriesWithStats = categoriesWithAll.map((category) => {
          if (category._id === "all") {
            return {
              ...category,
              count: statsResponse.totalTasks || 0,
            };
          }

          const stats = statsResponse.categories.find(
            (stat) => stat._id.toString() === category._id.toString()
          );

          return {
            ...category,
            count: stats?.count || 0,
            lastUsed: stats?.lastUsed || null,
            avgKarmaPoints: stats?.avgKarmaPoints || 0,
            hasBeenUsed: Boolean(stats?.count > 0),
          };
        });

        setCategories(categoriesWithStats);
      } catch (statsError) {
        console.warn("Failed to fetch category statistics:", statsError);
        // Continue with basic categories if stats fail
      }

      // Fetch user's recent categories if user is logged in
      if (user?.id) {
        try {
          const recentResponse = await getUserRecentCategories(5);
          setRecentCategories(recentResponse);
        } catch (recentError) {
          console.warn("Failed to fetch recent categories:", recentError);
          // This is not critical, so we don't set error state
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError(err.message || "Failed to load categories");

      // Use fallback empty array - let the backend seeding handle defaults
      const fallbackCategories = [
        {
          _id: "all",
          name: "all",
          displayName: "All Tasks",
          icon: "🏠",
          count: 0,
          hasBeenUsed: false,
          isActive: true,
          sortOrder: -1,
        },
      ];
      setCategories(fallbackCategories);
    } finally {
      setLoading(false);
    }
  };

  // Auto-create category if it doesn't exist
  const ensureCategoryExists = async (categoryName) => {
    try {
      // Check if category already exists
      const existingCategory = categories.find(
        (cat) =>
          cat.name === categoryName ||
          cat.displayName.toLowerCase() === categoryName.toLowerCase()
      );

      if (existingCategory && existingCategory._id !== "all") {
        return existingCategory._id;
      }

      // Extract emoji from the category name (if present)
      const emojiMatch = categoryName.match(/^[^\w\s]/);
      const icon = emojiMatch ? emojiMatch[0] : "📁"; // fallback icon if no emoji

      // Remove emoji from display name
      const displayName = categoryName.replace(/^[^\w\s]+/, "").trim();

      // Create new category
      const newCategory = await createCategory({
        name: displayName.toLowerCase().replace(/\s+/g, "-"),
        displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        icon, // Use the extracted emoji
        description: `User-created category: ${displayName}`,
        sortOrder: 999,
      });

      // Refresh categories to include the new one
      await fetchCategories();

      return newCategory._id;
    } catch (error) {
      console.error("Failed to create category:", error);
      // Return null if category creation fails - let the backend handle it
      return null;
    }
  };

  const refreshCategories = () => {
    fetchCategories();
  };

  // Get categories sorted by recent usage for current user
  const getPersonalizedCategories = () => {
    if (!recentCategories.length) return categories;

    // Create a map of recent category usage
    const recentMap = recentCategories.reduce((acc, recent) => {
      acc[recent._id.toString()] = recent;
      return acc;
    }, {});

    // Sort categories: "all" first, then recent ones, then by usage count, then alphabetically
    const sorted = [...categories].sort((a, b) => {
      // Always keep "all" first
      if (a._id === "all") return -1;
      if (b._id === "all") return 1;

      const aRecent = recentMap[a._id.toString()];
      const bRecent = recentMap[b._id.toString()];

      // If both are recent, sort by last used date
      if (aRecent && bRecent) {
        return new Date(bRecent.lastUsed) - new Date(aRecent.lastUsed);
      }

      // Recent categories come first
      if (aRecent && !bRecent) return -1;
      if (!aRecent && bRecent) return 1;

      // For non-recent categories, sort by usage count then by sort order
      if (a.count !== b.count) {
        return b.count - a.count;
      }

      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.displayName.localeCompare(b.displayName);
    });

    return sorted;
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Refetch when user changes

  return {
    categories,
    loading,
    error,
    recentCategories,
    refreshCategories,
    getPersonalizedCategories,
    ensureCategoryExists,
  };
};

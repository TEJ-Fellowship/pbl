import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  seedCategories,
  migrateCategories 
} from '../../api/categories';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    displayName: '',
    icon: '',
    description: '',
    color: '#6B7280'
  });

  useEffect(() => {
    fetchCategories();
  }, [showInactive]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories(showInactive);
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!newCategory.name || !newCategory.displayName) {
        alert('Name and Display Name are required');
        return;
      }

      await createCategory({
        ...newCategory,
        name: newCategory.name.toLowerCase().replace(/\s+/g, '-')
      });
      
      setNewCategory({
        name: '',
        displayName: '',
        icon: '',
        description: '',
        color: '#6B7280'
      });
      
      fetchCategories();
    } catch (err) {
      alert(`Error creating category: ${err.message}`);
    }
  };

  const handleUpdate = async (categoryId, updatedData) => {
    try {
      await updateCategory(categoryId, updatedData);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      alert(`Error updating category: ${err.message}`);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure? This will soft-delete the category.')) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      fetchCategories();
    } catch (err) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('This will create default categories. Continue?')) {
      return;
    }

    try {
      await seedCategories();
      alert('Categories seeded successfully!');
      fetchCategories();
    } catch (err) {
      alert(`Error seeding categories: ${err.message}`);
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm('This will migrate existing task categories. Continue?')) {
      return;
    }

    try {
      await migrateCategories();
      alert('Categories migrated successfully!');
      fetchCategories();
    } catch (err) {
      alert(`Error migrating categories: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-6">Loading categories...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Category Manager</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            {showInactive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
          <button
            onClick={handleSeed}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Seed Default
          </button>
          <button
            onClick={handleMigrate}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Migrate Legacy
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create New Category */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <h2 className="text-lg font-semibold mb-4">Create New Category</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name (lowercase-with-dashes)"
            value={newCategory.name}
            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Display Name"
            value={newCategory.displayName}
            onChange={(e) => setNewCategory(prev => ({ ...prev, displayName: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Icon (emoji)"
            value={newCategory.icon}
            onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Description"
            value={newCategory.description}
            onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
            className="border rounded px-3 py-2 col-span-2"
          />
        </div>
        <button
          onClick={handleCreate}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <Plus className="w-4 h-4" />
          Create Category
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Icon</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Display Name</th>
                <th className="px-4 py-3 text-left">Usage</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <CategoryRow
                  key={category._id}
                  category={category}
                  isEditing={editingId === category._id}
                  onEdit={() => setEditingId(category._id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(data) => handleUpdate(category._id, data)}
                  onDelete={() => handleDelete(category._id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CategoryRow = ({ category, isEditing, onEdit, onCancelEdit, onSave, onDelete }) => {
  const [editData, setEditData] = useState({
    displayName: category.displayName,
    icon: category.icon,
    description: category.description || '',
    color: category.color || '#6B7280',
    isActive: category.isActive
  });

  const handleSave = () => {
    onSave(editData);
  };

  if (isEditing) {
    return (
      <tr>
        <td className="px-4 py-3">
          <input
            type="text"
            value={editData.icon}
            onChange={(e) => setEditData(prev => ({ ...prev, icon: e.target.value }))}
            className="w-16 border rounded px-2 py-1"
          />
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{category.name}</td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={editData.displayName}
            onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
            className="w-full border rounded px-2 py-1"
          />
        </td>
        <td className="px-4 py-3 text-sm">{category.usageCount || 0}</td>
        <td className="px-4 py-3">
          <select
            value={editData.isActive}
            onChange={(e) => setEditData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
            className="border rounded px-2 py-1"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={!category.isActive ? 'opacity-50' : ''}>
      <td className="px-4 py-3 text-2xl">{category.icon}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{category.name}</td>
      <td className="px-4 py-3 font-medium">{category.displayName}</td>
      <td className="px-4 py-3 text-sm">{category.usageCount || 0} tasks</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs ${
          category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CategoryManager; 
import React, { useState } from "react";

const CourseForm = ({ course, onSave, onCancel }) => {
  const [title, setTitle] = useState(course ? course.title : '');
  const [description, setDescription] = useState(course ? course.description : '');
  const [imageUrl, setImageUrl] = useState(course ? course.imageUrl : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation
    if (!title || !description || !imageUrl) {
      console.error('Please fill in all course fields.');
      // In a full application, replace console.error with a user-friendly modal/notification.
      return;
    }
    onSave({ id: course?.id, title, description, imageUrl });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg dark:bg-gray-800">
        <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center dark:text-white">
          {course ? 'Edit Course' : 'Add New Course'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="courseTitle" className="block text-gray-800 text-lg font-medium mb-2 dark:text-gray-200">Title</label>
            <input
              type="text"
              id="courseTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
              placeholder="e.g., Introduction to React"
              required
            />
          </div>
          <div>
            <label htmlFor="courseDescription" className="block text-gray-800 text-lg font-medium mb-2 dark:text-gray-200">Description</label>
            <textarea
              id="courseDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
              placeholder="A brief overview of the course content..."
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="courseImageUrl" className="block text-gray-800 text-lg font-medium mb-2 dark:text-gray-200">Image URL</label>
            <input
              type="url"
              id="courseImageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
              placeholder="https://placehold.co/400x250/..."
              required
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;

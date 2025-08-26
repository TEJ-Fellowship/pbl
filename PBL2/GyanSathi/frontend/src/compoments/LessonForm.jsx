import { useState } from "react";

const LessonForm = ({ lesson, onSave, onCancel }) => {
  const [title, setTitle] = useState(lesson ? lesson.title : "");
  const [lessonContent, setLessonContent] = useState(
    lesson ? lesson.lessonContent : ""
  );
  const [resources, setResources] = useState(lesson ? lesson.resources || [] : []);
  const [topics, setTopics] = useState(
    lesson ? lesson.topics.join(", ") : ""
  );
  const [subjectCategory, setSubjectCategory] = useState(
    lesson ? lesson.subjectCategory : ""
  );

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setResources(files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !lessonContent || !topics || !subjectCategory) {
      console.error("Please fill in all lesson fields.");
      return;
    }
    onSave({
      id: lesson?.id,
      title,
      lessonContent,
      resources,
      topics: topics.split(",").map((t) => t.trim()).filter((t) => t),
      subjectCategory,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg dark:bg-gray-800">
        <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center dark:text-white">
          {lesson ? "Edit Lesson" : "Add New Lesson"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="lessonTitle"
              className="block text-gray-800 text-lg font-medium mb-2 dark:text-gray-200"
            >
              Title
            </label>
            <input
              type="text"
              id="lessonTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
              placeholder="e.g., HTML Basics"
              required
            />
          </div>

          {/* Lesson Content */}
          <div>
            <label
              htmlFor="lessonContent"
              className="block text-gray-800 text-lg font-medium mb-2 dark:text-gray-200"
            >
              Lesson Content
            </label>
            <textarea
              id="lessonContent"
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              rows="5"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
              placeholder="Write the main explanation, details, or notes for the lesson..."
              required
            ></textarea>
          </div>

          {/* Additional Resources */}
          <div>
            <label
              htmlFor="lessonResources"
              className="block text-gray-800 text-lg font-medium mb-2 dark:text-gray-200"
            >
              Additional Resources (PDF, Images, Docs, Videos)
            </label>
            <input
              type="file"
              id="lessonResources"
              multiple
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
            />
            {resources.length > 0 && (
              <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 list-disc pl-5">
                {resources.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Topics */}
          <div>
            <label
              htmlFor="lessonTopics"
              className="block text-gray-800 text-lg font-medium mb-2 dark:text-gray-200"
            >
              Topics (comma-separated)
            </label>
            <textarea
              id="lessonTopics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
              placeholder="e.g., HTML Structure, Tags, Elements"
              required
            ></textarea>
          </div>

          {/* Subject Category */}
          <div>
            <label
              htmlFor="lessonSubjectCategory"
              className="block text-gray-800 text-lg font-medium mb-2 dark:text-gray-200"
            >
              Subject Category
            </label>
            <input
              type="text"
              id="lessonSubjectCategory"
              value={subjectCategory}
              onChange={(e) => setSubjectCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500"
              placeholder="e.g., Web Development, Programming"
              required
            />
          </div>

          {/* Actions */}
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
              Save Lesson
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonForm;

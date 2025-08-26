import { useState } from "react";

import LessonForm from "../compoments/LessonForm";
import CourseForm from "../compoments/CourseForm"


const CourseManagement = ({  onAddCourse, onUpdateCourse, onDeleteCourse, onAddLesson, onUpdateLesson, onDeleteLesson, theme, courses, setCourses }) => {
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  // Handlers for Course actions
  const handleNewCourseClick = () => {
    setEditingCourse(null);
    setShowCourseForm(true);
  };

  const handleEditCourseClick = (course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  const handleSaveCourse = (courseData) => {
    if (courseData.id) {
      onUpdateCourse(courseData);
    } else {
      onAddCourse(courseData);
    }
    setShowCourseForm(false);
    setEditingCourse(null);
  };

  const handleDeleteCourseClick = (courseId) => {
    // Using window.confirm for simplicity, replace with custom modal in a real app
    if (window.confirm('Are you sure you want to delete this course and all its lessons?')) {
      onDeleteCourse(courseId);
      if (selectedCourseId === courseId) {
        setSelectedCourseId(null); // Deselect if the current course is deleted
      }
    }
  };

  // Handlers for Lesson actions
  const handleNewLessonClick = () => {
    setEditingLesson(null);
    setShowLessonForm(true);
  };

  const handleEditLessonClick = (lesson) => {
    setEditingLesson(lesson);
    setShowLessonForm(true);
  };

  const handleSaveLesson = (lessonData) => {
    if (!selectedCourseId) {
      console.error('No course selected for adding/editing lesson.');
      return; // Should not happen if UI is correct
    }

    if (lessonData.id) {
      onUpdateLesson(selectedCourseId, lessonData);
    } else {
      onAddLesson(selectedCourseId, lessonData);
    }
    setShowLessonForm(false);
    setEditingLesson(null);
  };

  const handleDeleteLessonClick = (lessonId) => {
    // Using window.confirm for simplicity, replace with custom modal in a real app
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      if (selectedCourseId) {
        onDeleteLesson(selectedCourseId, lessonId);
      }
    }
  };

  return (
    <div className={`min-h-screen p-6 font-sans ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold leading-tight">
          Content Management
        </h1>
        <p className="text-xl max-w-2xl mx-auto mt-2">
          Create, edit, and delete courses and lessons.
        </p>
      </header>

      <section className={`container mx-auto rounded-xl shadow-lg p-8 mb-10 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-3xl font-bold">Courses</h2>
          <button
            onClick={handleNewCourseClick}
            className="bg-green-600 text-white py-2 px-5 rounded-lg shadow-md hover:bg-green-700 transition duration-200 flex items-center text-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"></path></svg>
            Add New Course
          </button>
        </div>

        {courses.length === 0 ? (
          <p className="text-center text-lg py-8">No courses available. Click "Add New Course" to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <thead className={`border-b ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-gray-100 border-gray-200'}`}>
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Title</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Lessons</th>
                  <th className="py-3 px-6 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className={`border-b ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                    <td className="py-4 px-6 font-medium">
                      {course.title}
                    </td>
                    <td className="py-4 px-6">
                      {course.lessons.length}
                    </td>
                    <td className="py-4 px-6 text-center space-x-2">
                      <button
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`px-4 py-2 rounded-lg text-sm transition duration-200 ${
                          selectedCourseId === course.id
                            ? 'bg-indigo-500 text-white'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-800 dark:text-indigo-100 dark:hover:bg-indigo-700'
                        }`}
                      >
                        {selectedCourseId === course.id ? 'Selected' : 'Manage Lessons'}
                      </button>
                      <button
                        onClick={() => handleEditCourseClick(course)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition duration-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourseClick(course.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition duration-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Course Form Modal */}
      {showCourseForm && (
        <CourseForm
          course={editingCourse}
          onSave={handleSaveCourse}
          onCancel={() => {
            setShowCourseForm(false);
            setEditingCourse(null);
          }}
        />
      )}

      {/* Lesson Management Section */}
      {selectedCourse && (
        <section className={`container mx-auto rounded-xl shadow-lg p-8 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-3xl font-bold">Lessons for "{selectedCourse.title}"</h2>
            <button
              onClick={handleNewLessonClick}
              className="bg-green-600 text-white py-2 px-5 rounded-lg shadow-md hover:bg-green-700 transition duration-200 flex items-center text-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"></path></svg>
              Add New Lesson
            </button>
          </div>

          {selectedCourse.lessons.length === 0 ? (
            <p className="text-center text-lg py-8">No lessons for this course yet. Click "Add New Lesson" to create one!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <thead className={`border-b ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-gray-100 border-gray-200'}`}>
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Title</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Materials</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Topics</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Category</th>
                    <th className="py-3 px-6 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCourse.lessons.map((lesson) => (
                    <tr key={lesson.id} className={`border-b ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                      <td className="py-4 px-6 font-medium">{lesson.title}</td>
                      <td className="py-4 px-6 text-sm">
                        {lesson.materials.length > 0 ? lesson.materials.join(', ') : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {lesson.topics.length > 0 ? lesson.topics.join(', ') : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-sm">{lesson.subjectCategory}</td>
                      <td className="py-4 px-6 text-center space-x-2">
                        <button
                          onClick={() => handleEditLessonClick(lesson)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition duration-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLessonClick(lesson.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition duration-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Lesson Form Modal */}
      {showLessonForm && (
        <LessonForm
          lesson={editingLesson}
          onSave={handleSaveLesson}
          onCancel={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
          }}
        />
      )}
    </div>
  );
};

export default CourseManagement



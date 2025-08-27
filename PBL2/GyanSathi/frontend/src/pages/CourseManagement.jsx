import React, { useState } from "react";
import CourseForm from "../compoments/CourseForm";
import LessonForm from "../compoments/LessonForm";

const CourseManagement = ({
  courses,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  theme,
}) => {
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  // Find the selected course from the courses array
  const selectedCourse = courses.find(
    (c) => c.id === selectedCourseId || c._id === selectedCourseId
  );

  // Course CRUD handlers
  const handleNewCourseClick = () => {
    setEditingCourse(null);
    setShowCourseForm(true);
  };

  const handleEditCourseClick = (course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  const handleSaveCourse = (courseData) => {
    if (editingCourse) {
      onUpdateCourse({ ...editingCourse, ...courseData });
    } else {
      onAddCourse(courseData);
    }
    setShowCourseForm(false);
    setEditingCourse(null);
  };

  const handleDeleteCourseClick = (courseId) => {
    onDeleteCourse(courseId);
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
    }
  };

  // Lesson CRUD handlers
  const handleSelectCourseToManageLessons = (courseId) => {
    setSelectedCourseId(courseId);
    setEditingLesson(null);
    setShowLessonForm(false);
  };

  const handleNewLessonClick = () => {
    setEditingLesson(null);
    setShowLessonForm(true);
  };

  const handleEditLessonClick = (lesson) => {
    setEditingLesson(lesson);
    setShowLessonForm(true);
  };

  const handleSaveLesson = (lessonData) => {
    if (editingLesson) {
      onUpdateLesson(selectedCourseId, { ...editingLesson, ...lessonData });
    } else {
      onAddLesson(selectedCourseId, lessonData);
    }
    setShowLessonForm(false);
    setEditingLesson(null);
  };

  const handleDeleteLessonClick = (lessonId) => {
    onDeleteLesson(selectedCourseId, lessonId);
  };

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">Course Management</h2>
      <div className="mb-8 flex justify-between items-center">
        <button
          onClick={handleNewCourseClick}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition duration-300"
        >
          Add New Course
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length > 0 ? (
          courses.map((course) => (
            <div
              key={course.id || course._id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col border border-gray-200 dark:border-gray-700 ${
                selectedCourseId === (course.id || course._id)
                  ? "ring-2 ring-indigo-500"
                  : ""
              }`}
            >
              <h3 className="text-xl font-semibold mb-2 dark:text-white">
                {course.title}
              </h3>
              <p className="text-gray-700 mb-2 dark:text-gray-300">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => handleEditCourseClick(course)}
                  className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    handleDeleteCourseClick(course.id || course._id)
                  }
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Delete
                </button>
                <button
                  onClick={() =>
                    handleSelectCourseToManageLessons(course.id || course._id)
                  }
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
                >
                  Manage Lessons
                </button>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Lessons:{" "}
                {Array.isArray(course.lessons) ? course.lessons.length : 0}
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-600 dark:text-gray-400">
            No courses available.
          </p>
        )}
      </div>

      {/* Lessons Management Section */}
      {selectedCourse && (
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-4 text-center dark:text-white">
            Manage Lessons for: {selectedCourse.title}
          </h3>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleNewLessonClick}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition duration-300"
            >
              Add New Lesson
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(selectedCourse.lessons) &&
            selectedCourse.lessons.length > 0 ? (
              selectedCourse.lessons.map((lesson) => (
                <div
                  key={lesson.id || lesson._id}
                  className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex flex-col"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold dark:text-white">
                      {lesson.title}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditLessonClick(lesson)}
                        className="bg-yellow-400 text-gray-900 px-3 py-1 rounded hover:bg-yellow-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteLessonClick(lesson.id || lesson._id)
                        }
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-700 dark:text-gray-200 text-sm">
                    <div>Topics: {lesson.topics?.join(", ")}</div>
                    <div>Materials: {lesson.materials?.join(", ")}</div>
                    <div>Subject: {lesson.subjectCategory}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-600 dark:text-gray-400">
                No lessons available for this course.
              </p>
            )}
          </div>
        </div>
      )}

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

export default CourseManagement;

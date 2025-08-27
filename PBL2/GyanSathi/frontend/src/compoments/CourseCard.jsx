function CourseCard({ course, onViewCourse }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex flex-col dark:bg-gray-800 dark:border dark:border-gray-700">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            course.imageUrl ||
            `https://placehold.co/400x250/9CA3AF/FFFFFF?text=${encodeURIComponent(
              course.title
            )}`
          }
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/400x250/9CA3AF/FFFFFF?text=Image+Error`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Course Content */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2 dark:text-white">
          {course.title}
        </h3>
        <p className="text-gray-700 mb-4 flex-grow dark:text-gray-300">
          {course.description}
        </p>

        {/* Lessons Section */}
        <h4 className="text-lg font-bold text-gray-800 mb-3 dark:text-gray-200">
          Lessons:{" "}
          {Array.isArray(course.lessons) ? `(${course.lessons.length})` : "(0)"}
        </h4>
        <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4 dark:text-gray-300">
          {Array.isArray(course.lessons) && course.lessons.length > 0 ? (
            course.lessons.slice(0, 3).map((lesson, index) => (
              <li
                key={lesson.id || lesson._id || `lesson-${index}`}
                className="flex items-center text-sm"
              >
                <svg
                  className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                {lesson.title || lesson.name || `Lesson ${index + 1}`}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500 dark:text-gray-400">
              No lessons available yet.
            </li>
          )}
          {Array.isArray(course.lessons) && course.lessons.length > 3 && (
            <li className="text-sm text-gray-500 dark:text-gray-400">
              ...and {course.lessons.length - 3} more
            </li>
          )}
        </ul>

        {/* Action Button */}
        <button
          onClick={() => onViewCourse(course.id || course._id)}
          className="mt-auto bg-indigo-600 text-white py-3 px-6 rounded-xl shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          View Course
        </button>
      </div>
    </div>
  );
}

export default CourseCard;

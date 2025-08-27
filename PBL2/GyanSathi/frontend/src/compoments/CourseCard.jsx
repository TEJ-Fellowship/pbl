function CourseCard({ course, onViewCourse }) {
  return (
    <div className="bg-gradient-to-br from-[#f8fafc] to-[#e0e7ff] rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex flex-col border border-[#e0e7ff] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 dark:border-gray-700">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            course.imageUrl ||
            `https://placehold.co/400x250/6366f1/FFFFFF?text=${encodeURIComponent(
              course.title
            )}`
          }
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/400x250/6366f1/FFFFFF?text=Image+Error`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#6366f1]/60 to-transparent"></div>
      </div>

      {/* Course Content */}
      <div className="p-7 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-[#1e293b] mb-2 dark:text-white tracking-tight">
          {course.title}
        </h3>
        <p className="text-[#334155] mb-4 flex-grow dark:text-gray-300 text-base leading-relaxed">
          {course.description}
        </p>

        {/* Lessons Section */}
        <h4 className="text-lg font-semibold text-[#6366f1] mb-3 dark:text-indigo-300 tracking-wide">
          Lessons:{" "}
          {Array.isArray(course.lessons) ? `(${course.lessons.length})` : "(0)"}
        </h4>
        <ul className="list-none space-y-1 text-[#475569] mb-4 dark:text-gray-300">
          {Array.isArray(course.lessons) && course.lessons.length > 0 ? (
            course.lessons.slice(0, 3).map((lesson, index) => (
              <li
                key={lesson.id || lesson._id || `lesson-${index}`}
                className="flex items-center text-sm gap-2"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#6366f1]/10 text-[#6366f1] dark:bg-indigo-700 dark:text-indigo-200">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </span>
                <span className="truncate">
                  {lesson.title || lesson.name || `Lesson ${index + 1}`}
                </span>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-400 dark:text-gray-400 italic">
              No lessons available yet.
            </li>
          )}
          {Array.isArray(course.lessons) && course.lessons.length > 3 && (
            <li className="text-sm text-gray-400 dark:text-gray-400">
              ...and {course.lessons.length - 3} more
            </li>
          )}
        </ul>

        {/* Action Button */}
        <button
          onClick={() => onViewCourse(course.id || course._id)}
          className="mt-auto bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white py-3 px-6 rounded-xl shadow-lg hover:from-[#4f46e5] hover:to-[#6366f1] transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-200 font-semibold tracking-wide text-lg"
        >
          View Course
        </button>
      </div>
    </div>
  );
}

export default CourseCard;

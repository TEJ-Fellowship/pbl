const CourseDetail = ({ course, onBackToHome, onViewLesson }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-sans dark:from-gray-800 dark:to-gray-900 dark:text-gray-100">
      <div className="container mx-auto bg-white rounded-xl shadow-2xl p-8 lg:p-12 dark:bg-gray-700">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition duration-200 mb-6 font-semibold dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to All Courses
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
          <div className="flex-shrink-0 w-full md:w-1/3 lg:w-1/4">
            <img
              src={course.imageUrl}
              alt={course.title}
              className="w-full h-auto object-cover rounded-xl shadow-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/400x250/9CA3AF/FFFFFF?text=Image+Error`;
              }}
            />
          </div>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 dark:text-white">
              {course.title}
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed dark:text-gray-300">
              {course.description}
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-6 dark:text-gray-200">Course Lessons</h2>
        {course.lessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.lessons.map((lesson) => (
              <div key={lesson.id} className="bg-gray-50 rounded-xl p-6 shadow-md border border-gray-100 flex flex-col justify-between dark:bg-gray-800 dark:border-gray-600">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">{lesson.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Topics: {lesson.topics && lesson.topics.length > 0 ? lesson.topics.join(', ') : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => onViewLesson(lesson.id)}
                  className="mt-4 bg-blue-600 text-white py-2 px-5 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 self-start"
                >
                  View Lesson
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 italic py-8 dark:text-gray-400">No lessons available for this course yet.</p>
        )}
      </div>
    </div>
  );
};

export default CourseDetail
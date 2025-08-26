const LessonDetail = ({ lesson, onBackToCourse }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-sans dark:from-gray-800 dark:to-gray-900 dark:text-gray-100">
      <div className="container mx-auto bg-white rounded-xl shadow-2xl p-8 lg:p-12 mb-8 dark:bg-gray-700">
        <button
          onClick={onBackToCourse}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition duration-200 mb-6 font-semibold dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Course
        </button>

        <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 dark:text-white">{lesson.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Lesson Materials */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 dark:text-gray-200">Materials</h2>
            {lesson.materials && lesson.materials.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                {lesson.materials.map((material, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1-3a1 1 0 100 2h.01a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                    {material.startsWith('http') ? (
                      <a href={material} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                        {material}
                      </a>
                    ) : (
                      <span>{material}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 italic dark:text-gray-400">No materials provided for this lesson.</p>
            )}
          </div>

          {/* Lesson Topics */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 dark:text-gray-200">Topics</h2>
            {lesson.topics && lesson.topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {lesson.topics.map((topic, index) => (
                  <span key={index} className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-indigo-800 dark:text-indigo-100">
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 italic dark:text-gray-400">No topics specified for this lesson.</p>
            )}
            <p className="text-lg text-gray-700 mt-4 dark:text-gray-300">
              <span className="font-semibold">Subject Category:</span> {lesson.subjectCategory || 'N/A'}
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 dark:text-gray-200">Lesson Content</h2>
          {lesson.content ? (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-6 whitespace-pre-wrap">
                {lesson.content}
              </p>
            </div>
          ) : (
            <p className="text-gray-600 italic dark:text-gray-400">No content available for this lesson.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
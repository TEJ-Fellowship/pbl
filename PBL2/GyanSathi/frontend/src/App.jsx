import { useState } from "react";
import HomePage from "./pages/Homepage";
import CourseDetail from "./pages/CourseDetail";
import CourseManagement from "./pages/CourseManagement";
import LessonDetail from "./pages/LessonDetail";

const App = () => {
  const [view, setView] = useState('home'); // 'home', 'manage', 'courseDetail', 'lessonDetail'
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  // Initial dummy data for courses and lessons
  const [courses, setCourses] = useState([
    {
      id: 'c1',
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of web development, including HTML, CSS, and JavaScript. This course covers everything from basic syntax to building responsive layouts. Perfect for beginners!',
      imageUrl: 'https://placehold.co/400x250/06B6D4/FFFFFF?text=Web+Dev',
      lessons: [
        { id: 'l1.1', title: 'HTML Basics', materials: ['https://www.w3schools.com/html/default.asp', 'HTML_Cheatsheet.pdf'], topics: ['HTML Structure', 'Tags', 'Elements', 'Attributes'], subjectCategory: 'Web Development' },
        { id: 'l1.2', title: 'CSS Styling', materials: ['https://www.w3schools.com/css/default.asp', 'CSS_Layouts.mp4'], topics: ['Selectors', 'Box Model', 'Flexbox', 'Grid', 'Responsiveness'], subjectCategory: 'Web Development' },
        { id: 'l1.3', title: 'JavaScript Fundamentals', materials: ['https://javascript.info/', 'JS_CrashCourse.mp4', 'Modern_JS_Book.pdf'], topics: ['Variables', 'Functions', 'DOM Manipulation', 'Events', 'ES6 Features'], subjectCategory: 'Programming' },
        { id: 'l1.4', title: 'Introduction to Responsive Design', materials: ['https://developer.mozilla.org/en-US/docs/Web/Guide/Responsive'], topics: ['Media Queries', 'Mobile-First', 'Fluid Layouts', 'Viewport'], subjectCategory: 'Web Design' },
        { id: 'l1.5', title: 'Introduction to Web Hosting', materials: ['Web_Hosting_Guide.pdf'], topics: ['Domains', 'Servers', 'Deployment'], subjectCategory: 'Web Development' },
      ],
    },
    {
      id: 'c2',
      title: 'React Fundamentals',
      description: 'Dive deep into React.js, component-based architecture, and state management. Build dynamic and interactive user interfaces with confidence.',
      imageUrl: 'https://placehold.co/400x250/6366F1/FFFFFF?text=React+JS',
      lessons: [
        { id: 'l2.1', title: 'Understanding Components', materials: ['React_Components.pdf', 'React_Intro_Video.mp4'], topics: ['Functional Components', 'Class Components', 'Component Lifecycle'], subjectCategory: 'Programming' },
        { id: 'l2.2', title: 'Props and State', materials: ['React_Props_State_Tutorial.html'], topics: ['Passing Props', 'useState Hook', 'Component Re-renders', 'State Management'], subjectCategory: 'Programming' },
        { id: 'l2.3', title: 'Handling Events', materials: ['React_Events_Guide.doc'], topics: ['Synthetic Events', 'Event Handlers', 'Forms'], subjectCategory: 'Programming' },
        { id: 'l2.4', title: 'Introduction to Hooks', materials: ['React_Hooks_CheatSheet.pdf'], topics: ['useEffect', 'useContext', 'useRef', 'Custom Hooks'], subjectCategory: 'Programming' },
      ],
    },
    {
      id: 'c3',
      title: 'Data Science with Python',
      description: 'Explore data analysis, machine learning, and visualization using Python. Learn to extract insights from data and build predictive models.',
      imageUrl: 'https://placehold.co/400x250/EC4899/FFFFFF?text=Data+Science',
      lessons: [
        { id: 'l3.1', title: 'Python for Data Analysis', materials: ['Python_Data_Science_Workbook.pdf'], topics: ['Numpy', 'Pandas', 'Data Cleaning', 'Data Manipulation'], subjectCategory: 'Data Science' },
        { id: 'l3.2', title: 'Machine Learning Basics', materials: ['ML_Algorithms_Overview.mp4', 'Scikit-learn_Docs.html'], topics: ['Supervised Learning', 'Unsupervised Learning', 'Regression', 'Classification', 'Model Evaluation'], subjectCategory: 'Data Science' },
        { id: 'l3.3', title: 'Data Visualization', materials: ['Matplotlib_Seaborn_Tutorial.pdf'], topics: ['Matplotlib', 'Seaborn', 'Plotting Techniques'], subjectCategory: 'Data Science' },
      ],
    },
  ]);

  // Functions to manage courses in the main App state
  const handleAddCourse = (newCourse) => {
    setCourses([...courses, { ...newCourse, id: `c${Date.now()}`, lessons: [] }]);
  };

  const handleUpdateCourse = (updatedCourse) => {
    setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const handleDeleteCourse = (courseId) => {
    setCourses(courses.filter(c => c.id !== courseId));
    // Also clear selected course/lesson if they belong to the deleted course
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
      setSelectedLessonId(null);
      setView('home');
    }
  };

  // Functions to manage lessons for a specific course
  const handleAddLesson = (courseId, newLesson) => {
    setCourses(courses.map(course =>
      course.id === courseId
        ? { ...course, lessons: [...course.lessons, { ...newLesson, id: `l${Date.now()}` }] }
        : course
    ));
  };

  const handleUpdateLesson = (courseId, updatedLesson) => {
    setCourses(courses.map(course =>
      course.id === courseId
        ? {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === updatedLesson.id ? updatedLesson : lesson
            ),
          }
        : course
    ));
  };

  const handleDeleteLesson = (courseId, lessonId) => {
    setCourses(courses.map(course =>
      course.id === courseId
        ? { ...course, lessons: course.lessons.filter(lesson => lesson.id !== lessonId) }
        : course
    ));
    // Clear selected lesson if it's the one being deleted
    if (selectedCourseId === courseId && selectedLessonId === lessonId) {
      setSelectedLessonId(null);
      setView('courseDetail'); // Go back to course detail
    }
  };

  // Navigation Handlers
  const handleViewCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId(null); // Clear any selected lesson
    setView('courseDetail');
  };

  const handleBackToHome = () => {
    setSelectedCourseId(null);
    setSelectedLessonId(null);
    setView('home');
  };

  const handleViewLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    setView('lessonDetail');
  };

  const handleBackToCourse = () => {
    setSelectedLessonId(null);
    setView('courseDetail');
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const currentCourse = selectedCourseId ? courses.find(c => c.id === selectedCourseId) : null;
  const currentLesson = currentCourse && selectedLessonId ? currentCourse.lessons.find(l => l.id === selectedLessonId) : null;

  // Dynamically render the current view component
  let ContentView;
  if (view === 'home') {
    ContentView = <HomePage courses={courses} onViewCourse={handleViewCourse} />;
  } else if (view === 'manage') {
    ContentView = (
      <CourseManagement
        courses={courses}
        onAddCourse={handleAddCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
        onAddLesson={handleAddLesson}
        onUpdateLesson={handleUpdateLesson}
        onDeleteLesson={handleDeleteLesson}
        theme={theme}
      />
    );
  } else if (view === 'courseDetail' && currentCourse) {
    ContentView = (
      <CourseDetail
        course={currentCourse}
        onBackToHome={handleBackToHome}
        onViewLesson={handleViewLesson}
      />
    );
  } else if (view === 'lessonDetail' && currentLesson) {
    ContentView = (
      <LessonDetail
        lesson={currentLesson}
        onBackToCourse={handleBackToCourse}
      />
    );
  } else {
    // Default to home or a loading/error state if none match
    ContentView = <HomePage courses={courses} onViewCourse={handleViewCourse} />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Navigation Bar */}
      <nav className={`p-4 shadow-lg sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-indigo-700'}`}>
        <div className="container mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="text-white text-3xl font-bold">GyaanSathi</div>
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              onClick={() => setView('home')}
              className={`text-white px-5 py-2 rounded-lg text-lg font-medium transition duration-300 flex items-center ${
                view === 'home' ? 'bg-indigo-600 shadow-md' : 'hover:bg-indigo-600'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              Home
            </button>
            <button
              onClick={() => setView('manage')}
              className={`text-white px-5 py-2 rounded-lg text-lg font-medium transition duration-300 flex items-center ${
                view === 'manage' ? 'bg-indigo-600 shadow-md' : 'hover:bg-indigo-600'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 00-.707-.293h-1a1 1 0 100 2h1a1 1 0 00.707-.293l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM17 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414zm-.707 2.121A1 1 0 003 10a1 1 0 001 1h1a1 1 0 100-2H4a1 1 0 00-.707.293z"></path></svg>
              Manage Content
            </button>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label="Toggle dark/light mode"
            >
              {theme === 'light' ? (
                // Sun icon for light mode
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 00-.707-.293h-1a1 1 0 100 2h1a1 1 0 00.707-.293l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM17 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414zm-.707 2.121A1 1 0 003 10a1 1 0 001 1h1a1 1 0 100-2H4a1 1 0 00-.707.293z"></path>
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.907A8.001 8.001 0 016.093 2.707a.5.5 0 00-.671.121A7.962 7.962 0 003 10c0 4.418 3.582 8 8 8a8.001 8.001 0 006.907-3.328.5.5 0 00-.121-.671z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Conditional Rendering of Views */}
      {ContentView}
    </div>
  );
};

export default App
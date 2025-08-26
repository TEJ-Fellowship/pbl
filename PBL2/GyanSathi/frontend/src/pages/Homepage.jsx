import CourseCard from "../compoments/CourseCard";

function HomePage({ courses, onViewCourse }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-sans dark:from-gray-800 dark:to-gray-900 dark:text-gray-100">
      {/* Header Section */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4 dark:text-white">
          Welcome to Our Learning Platform
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto dark:text-gray-300">
          Discover a wide range of courses and start your learning journey today!
        </p>
      </header>

      {/* Courses Section */}
      <section className="container mx-auto">
        <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center dark:text-gray-200">Our Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {courses.length > 0 ? (
            courses.map((course) => (
              <CourseCard key={course.id} course={course} onViewCourse={onViewCourse}/>
            ))
          ) : (
            <p className="text-center text-gray-600 text-lg col-span-full dark:text-gray-400">No courses available. Please check back later or add some from the "Manage Content" section!</p>
          )}
        </div>
      </section>

      {/* Footer Section (Optional) */}
      <footer className="text-center mt-12 text-gray-500 text-sm dark:text-gray-400">
        <p>&copy; 2025 Learning Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage


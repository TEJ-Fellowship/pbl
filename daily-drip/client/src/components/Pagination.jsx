import React from 'react';

const Pagination = ({ postsPerPage, totalPosts, setCurrentPage, currentPage }) => {
  let pages = [];
  for (let i = 1; i <= Math.ceil(totalPosts / postsPerPage); i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center space-x-2 my-8">
      {pages.map((page, index) => {
        return (
          <button
            key={index}
            onClick={() => setCurrentPage(page)}
            className={`px-4 py-2 rounded-md ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            } transition-colors duration-200`}
          >
            {page}
          </button>
        );
      })}
    </div>
  );
};

export default Pagination;
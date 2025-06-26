import React from "react";

const CategoryFilter = ({
  categories,
  selectedCategory,
  handleSetSelectedCategory,
}) => {
  return (
    <>
      <div className="px-6 mb-4 ">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSetSelectedCategory(category.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary focus:ring-opacity-50 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-primary-light to-primary text-background dark:text-white border-transparent shadow-sm transform scale-105"
                  : "bg-background dark:bg-background-politeDark text-text-light dark:text-text-spotlight border-border dark:border-border-green hover:border-primary-light dark:hover:border-primary hover:bg-background-light dark:hover:bg-background-politeDark hover:text-text-dark dark:hover:text-white hover:shadow-sm active:scale-95"
              }`}
            >
              <span className="mr-1 text-base">{category.icon}</span>
              <span className="whitespace-nowrap">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default CategoryFilter;

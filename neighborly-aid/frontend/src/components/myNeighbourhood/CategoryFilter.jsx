import React from "react";

const CategoryFilter = ({
  categories,
  selectedCategory,
  handleSetSelectedCategory,
}) => {
  return (
    <>
      <div className="px-6 mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSetSelectedCategory(category.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-transparent"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default CategoryFilter;

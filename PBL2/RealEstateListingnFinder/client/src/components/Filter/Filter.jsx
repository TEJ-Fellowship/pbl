import React, { useState } from "react";
import { ChevronDown, X, Filter } from "lucide-react";
import { useEffect } from "react";

const FilterOptions = ({ onFilterChange, onSortChange }) => {
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState("Relevance");

  const filterCategories = {
    beds: {
      label: "Beds",
      options: ["Any", "1+", "2+", "3+", "4+", "5+"],
    },
    features: {
      label: "Features",
      options: [
        "Swimming Pool",
        "Gym",
        "Parking",
        "Balcony",
        "Garden",
        "Security",
        "Elevator",
        "AC",
        "Furnished",
      ],
    },
    parking: {
      label: "Parking",
      options: ["Any", "No Parking", "1 Space", "2+ Spaces", "Covered"],
    },
    propertyType: {
      label: "Property Type",
      options: [
        "Any",
        "House",
        "Apartment",
        "Condo",
        "Townhouse",
        "Villa",
        "Studio",
      ],
    },
    priceRange: {
      label: "Price Range",
      options: [
        "Any",
        "Under $500K",
        "$500K-$750K",
        "$750K-$1M",
        "$1M-$1.5M",
        "$1.5M+",
      ],
    },
    listingAge: {
      label: "Listed",
      options: ["Any Time", "Last 24 hours", "Last Week", "Last Month"],
    },
  };

  const sortOptions = [
    "Relevance",
    "Price: Low to High",
    "Price: High to Low",
    "Newest First",
    "Size: Largest First",
    "Most Popular",
  ];

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(activeFilters);
    }
  }, [activeFilters, onFilterChange]);

  useEffect(() => {
    if (onSortChange) {
      onSortChange(sortBy);
    }
  }, [sortBy, onSortChange]);

  const handleFilterSelect = (category, option) => {
    setActiveFilters((prevFilters) => {
      const currentOptions = prevFilters[category] || [];
      if (option === "Any" || option === "Any Time") {
        return {
          ...prevFilters,
          [category]: [],
        };
      }

      // Check if the option is already selected
      const isSelected = currentOptions.includes(option);

      // Toggle option
      const updatedOptions = isSelected
        ? currentOptions.filter((o) => o !== option) // Remove if already selected
        : [...currentOptions, option]; // Add if not selected

      return {
        ...prevFilters,
        [category]: updatedOptions,
      };
    });
  };

  const clearFilter = (category, value) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      if (newFilters[category]) {
        newFilters[category] = newFilters[category].filter((v) => v !== value);
        if (newFilters[category].length === 0) {
          delete newFilters[category];
        }
      }
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
  };

  const FilterDropdown = ({ category, data }) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeValue = activeFilters[category];

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-10 px-4 items-center justify-center gap-x-2 rounded-lg border transition-colors ${
            activeValue
              ? "bg-blue-100 border-blue-300 text-blue-800"
              : "bg-white border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span className="text-sm font-medium">{data.label}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-12 left-0 z-50 bg-white border border-slate-300 rounded-lg shadow-lg min-w-48 max-h-64 overflow-y-auto">
            {data.options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  handleFilterSelect(category, option);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                  activeValue && activeValue.includes(option)
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SortDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 px-4 items-center justify-center gap-x-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-medium">Sort: {sortBy}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-12 right-0 z-50 bg-white border border-slate-300 rounded-lg shadow-lg min-w-48">
            {sortOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSortBy(option);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                  sortBy === option
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Main Filter Bar */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        {Object.entries(filterCategories).map(([key, data]) => (
          <FilterDropdown key={key} category={key} data={data} />
        ))}

        <div className="ml-auto">
          <SortDropdown />
        </div>
      </div>

      {/* Active Filters */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm font-medium text-slate-600">
            Active filters:
          </span>

          {Object.entries(activeFilters).map(([category, values]) =>
            values.map((value) => (
              <span
                key={`${category}-${value}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {`${value}`}
                <button
                  onClick={() => clearFilter(category, value)}
                  className="hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </span>
            ))
          )}

          <button
            onClick={clearAllFilters}
            className="text-sm text-slate-500 hover:text-slate-700 underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-slate-600 text-sm">
        Showing results with current filters
      </div>
    </div>
  );
};

export default FilterOptions;

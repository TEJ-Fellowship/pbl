import { Search } from "lucide-react";

const SearchBar = () => {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search
        //size: width and height 
          size={18}
          //translate-y-1/2 : center it vertically, move it up by half of its height
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search books by title"
          /*py: padding top and bottom,
            outline: line that is drawn around elements, OUTSIDE the borders, to make the element "stand out",
            focus: change the border color when focused
          */

          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gray-400"
        />
      </div>
    </div>
  );
};

export default SearchBar;

import { Search, X } from "lucide-react";

const SearchComponenet = () => {
  return (
    <>
      <div className="mb-4">
        <div className="flex w-full max-w-6xl mx-auto ">
          <div className="flex w-full items-stretch rounded-xl h-12 shadow-sm border  border-slate-300 bg-slate-200 overflow-hidden">
            <div className="flex items-center justify-center pl-6">
              <Search size={24} className="text-neutral-500" />
            </div>
            <input
              className="flex-1 px-4 py-4 text-slate-900 placeholder:text-slate-400 text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0 focus:border-none"
              defaultValue="Hattiban, Lalitpur"
              placeholder="Enter city, neighborhood, or address"
            />
            <button className="flex items-center justify-center pr-6 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchComponenet;

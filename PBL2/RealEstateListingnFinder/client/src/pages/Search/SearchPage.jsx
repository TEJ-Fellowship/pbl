import { ChevronLeft, ChevronRight } from "lucide-react";
import SearchComponenet from "../../components/Search/Search";
import FilterOptions from "../../components/Filter/Filter";
import { useProperties } from "../../hooks/useProperties";

const SearchPage = () => {
  const { properties } = useProperties();

  

  return (
    <>
      <div
        className="relative flex min-h-screen  flex-col bg-slate-50"
        style={{ fontFamily: '"Work Sans", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container m-auto w-full flex h-full grow flex-col ">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-6xl flex-1">
              {/* Search Bar */}

              <SearchComponenet />

              {/* Filter Buttons */}

              <FilterOptions />

              {/* Results Header */}
              <h2 className="text-slate-900 text-2xl font-bold leading-tight tracking-tight px-4 pb-3 pt-5">
                {properties.length} results
              </h2>

              {/* Property Listings */}
              <div className="space-y-4">
                {properties.map((property) => (
                  
                  <div key={property.id} className="p-4">
                    <div className="flex items-stretch justify-between gap-4 rounded-lg hover:bg-slate-100 transition-colors p-4 -m-4 cursor-pointer">
                      <div className="flex flex-[2_2_0px] flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          {property.featured && (
                            <p className="text-slate-500 text-sm font-normal leading-normal">
                              Featured
                            </p>
                          )}
                          <p className="text-slate-900 text-base font-bold leading-tight">
                            {property.title}
                          </p>
                          <p className="text-slate-500 text-sm font-normal leading-normal">
                            {property.specs}
                          </p>
                        </div>
                        <button className="flex min-w-21 max-w-120 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-slate-200 text-slate-900 text-sm font-medium leading-normal w-fit hover:bg-slate-300 transition-colors">
                          <span className="truncate">{property.price}</span>
                        </button>
                      </div>
                      <div
                        className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex-1"
                        style={{
                          
                          backgroundImage: `url("http://localhost:5000/${property.images[0].replace(
                            /\\/g,
                            "/"
                          )}")`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center p-4">
                <a
                  href="#"
                  className="flex w-10 h-10 items-center justify-center hover:bg-slate-200 rounded-full transition-colors"
                >
                  <ChevronLeft size={18} className="text-slate-900" />
                </a>
                <a
                  className="text-sm font-bold leading-normal tracking-wide flex w-10 h-10 items-center justify-center text-slate-900 rounded-full bg-slate-200"
                  href="#"
                >
                  1
                </a>
                <a
                  className="text-sm font-normal leading-normal flex w-10 h-10 items-center justify-center text-slate-900 rounded-full hover:bg-slate-200 transition-colors"
                  href="#"
                >
                  2
                </a>
                <a
                  className="text-sm font-normal leading-normal flex w-10 h-10 items-center justify-center text-slate-900 rounded-full hover:bg-slate-200 transition-colors"
                  href="#"
                >
                  3
                </a>
                <a
                  className="text-sm font-normal leading-normal flex w-10 h-10 items-center justify-center text-slate-900 rounded-full hover:bg-slate-200 transition-colors"
                  href="#"
                >
                  4
                </a>
                <a
                  className="text-sm font-normal leading-normal flex w-10 h-10 items-center justify-center text-slate-900 rounded-full hover:bg-slate-200 transition-colors"
                  href="#"
                >
                  5
                </a>
                <a
                  href="#"
                  className="flex w-10 h-10 items-center justify-center hover:bg-slate-200 rounded-full transition-colors"
                >
                  <ChevronRight size={18} className="text-slate-900" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPage;

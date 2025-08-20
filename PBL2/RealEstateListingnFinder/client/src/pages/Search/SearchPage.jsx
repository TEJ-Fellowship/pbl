import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SearchComponenet from "../../components/Search/Search";
import FilterOptions from "../../components/Filter/Filter";

const SearchPage = () => {
  const properties = [
    {
      id: 1,
      featured: true,
      title: "Charming 2-Bedroom Home in Pacific Heights",
      specs: "2 beds · 2 baths · 1,200 sqft",
      price: "$1,500,000",
      image:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      featured: false,
      title: "Spacious 3-Bedroom Apartment with City Views",
      specs: "3 beds · 2 baths · 1,500 sqft",
      price: "$2,200,000",
      image:
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      featured: false,
      title: "Cozy Studio in the Heart of Downtown",
      specs: "Studio · 1 bath · 500 sqft",
      price: "$800,000",
      image:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    },
    {
      id: 4,
      featured: false,
      title: "Luxury Penthouse with Panoramic Ocean Views",
      specs: "4 beds · 3 baths · 2,500 sqft",
      price: "$4,500,000",
      image:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
    },
  ];

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
                1,234 results
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
                          backgroundImage: `url("${property.image}")`,
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

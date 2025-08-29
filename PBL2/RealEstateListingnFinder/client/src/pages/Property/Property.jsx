import { useState } from "react";
import { useParams } from "react-router-dom";
import { useProperty } from "../../hooks/useProperties";
import MapwithStreetView from "../../components/Map/MapwithStreetView";

const Property = () => {
  const { id } = useParams();

  const { property, loading, error } = useProperty(id);

  const neighborhoodData = {
    tabs: ["News & Trends", "Local Buzz", "Nearby Places", "Community Chatter"],
    insights: [
      {
        title: "Community Development",
        content:
          "Local council approves new park development. Source: News API",
      },
      {
        title: "New Cafe Opening",
        content:
          "Just saw the new cafe on Main St. - great coffee! Source: Twitter",
      },
    ],
  };

  const [activeTab, setActiveTab] = useState(0);

  if (loading) return <p>Loading property details</p>;
  if (error) return console.log(error);
  if (!property) return <p>Property not found</p>;

  const location = property.location;
  const [lat, lng] = location.split(",");

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans overflow-y-hidden">
      <main className="px-10 py-5 flex justify-center flex-1">
        <div className="max-w-4xl w-full flex flex-col gap-4">
          {/* Hero Section */}
          <div
            className="relative w-full h-80 rounded-lg bg-cover bg-center"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCaCbNlPyn4lhGITrb--WQK655oU-rRhZoOjoBbwW7Y6TybF9xa0kX9tlPGHlPTPf6pM9WIHCG-ZLxMx4rMpB1ioYVxbICBEbEgeJDhDVbfdzeMZxN0ZTQp1QTR8pBP5ujsqU6RR-PZKPhYIUSJRJ0OIavFPxXMLiJgK_aWUVHi_h0rBTIj7UEx239VYsZXRVZxgvTXLWZ1o0dTRyHJ-WJgKjicrFgCoLVcmrnTHSANcC6C39n-FMa8NsfZKYM4PrHh142Gcl19T7mx")',
            }}
          >
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full bg-white ${
                    i === 0 ? "" : "opacity-50"
                  }`}
                ></span>
              ))}
            </div>
          </div>
          {/* Property Info */}
          <h1 className="text-2xl font-bold text-gray-900">
            Modern Family Home
          </h1>
          <p className="text-gray-900 text-base">
            This stunning family home offers a perfect blend of modern design
            and comfortable living. Featuring spacious interiors, high-end
            finishes, and a beautifully landscaped backyard, it's an ideal
            retreat for families seeking both style and functionality.
          </p>
          {/* features */}
          <h3 className="text-[#0d151c] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
            Key Features
          </h3>
          <div className="p-4 grid grid-cols-2">
            <div className="flex flex-col gap-1 border-t border-solid border-t-[#cedde8] py-4 pr-2">
              <p className="text-[#49779c] text-sm font-normal leading-normal">
                Bedrooms
              </p>
              <p className="text-[#0d151c] text-sm font-normal leading-normal">
                4
              </p>
            </div>
            <div className="flex flex-col gap-1 border-t border-solid border-t-[#cedde8] py-4 pl-2">
              <p className="text-[#49779c] text-sm font-normal leading-normal">
                Bathrooms
              </p>
              <p className="text-[#0d151c] text-sm font-normal leading-normal">
                3
              </p>
            </div>
            <div className="flex flex-col gap-1 border-t border-solid border-t-[#cedde8] py-4 pr-2">
              <p className="text-[#49779c] text-sm font-normal leading-normal">
                Square Footage
              </p>
              <p className="text-[#0d151c] text-sm font-normal leading-normal">
                2,500 sq ft
              </p>
            </div>
            <div className="flex flex-col gap-1 border-t border-solid border-t-[#cedde8] py-4 pl-2">
              <p className="text-[#49779c] text-sm font-normal leading-normal">
                Lot Size
              </p>
              <p className="text-[#0d151c] text-sm font-normal leading-normal">
                0.25 acres
              </p>
            </div>
          </div>
          {/* Address */}
          <h3 className="text-lg font-bold text-gra-900 mt-4">Address</h3>
          <p className="text-gray-900 text-base">Kupondole, Lalitpur</p>
          {/* image */}

          <MapwithStreetView initialLat={lat} initialLng={lng} />
          {/* Agent Info */}
          <h3 className="text-lg font-bold text-gray-900 mt-4">Listing User</h3>
          <div className="flex items-center gap-4 bg-slate-50 p-2 min-h-[72px]">
            <div
              className="h-14 w-14 rounded-full bg-cover bg-conter"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKqVi3kVH-fkTKQmUrjce_QPoF7SAIGNLq2AR0b9e878Y3M9sMGxcj6DIrkViFHfKfXZ5BaoSF1QI-JawZcjl6J-_eB4-6pGyvHmjGVGJWGvMtEIr0YmLixkMoQLNfmQV4itKNfcef4KV8XrCMkuVBBqgcEd_6AcTilLsGWSwmHmZT0vKQvaZ8gxk1CWoPKbyBxupZcC2SVY1tjvqVKZ7TwGXreaQ_xhC5gyS4fkza6rqgd7wulGBOYas0ZVJHRhq0ildvu41SQXcY")',
              }}
            ></div>
            <div>
              <p className="text-gray-900 font-medium">Manoj Pandey</p>
              <p className="text-sky-700 text-sm">Licensed Agent</p>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap mt-3">
            <button className="px-4 h-10 rounded-lg bg-sky-500 text-white font-bold text-sm">
              Contact Agent
            </button>
            <button className="px-4 h-10 rounded-lg bg-slate-200 text-gray-900 font-bold text-sm">
              Save Property
            </button>
          </div>
          {/* Similar Properties */}
          <h3 className="text-[#0d151c] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
            Similar Properties
          </h3>
          <div className="flex overflow-x-auto scrollbar-hide">
            <div className="flex items-stretch p-4 gap-3">
              {/* Property Card */}
              <div className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-[10rem]">
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex flex-col"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDavikT4HerCqwmReucUano50yMGVDbNRp-43YQKFihobWBWKkPxjCXECiX_fTloYSKO7RmhdoxSDSfNv6C0zEPJ2wPIstUrThxmu7DuwLG_zeGVvjDqk3MwW-Ix8_pd8RJsu35uZUiip_SXZLyaLH3q90aGFcvu148ufsUHXcXYE7KoTqpI-1d11Yj9Buu2zN5xNgfo9vVZZE4bvKHoG_Z6FoRvXMTYUCaNreMn5WVgo3JzDDkNJWDK3QeeQiM33q8VBrKjjpGSTF6")',
                  }}
                ></div>
                <div>
                  <p className="text-[#0d151c] text-base font-medium leading-normal">
                    Charming Cottage
                  </p>
                  <p className="text-[#49779c] text-sm font-normal leading-normal">
                    3 beds, 2 baths
                  </p>
                </div>
              </div>

              {/* Repeat other property cards similarly */}
            </div>
          </div>

          <div>
            <h2 className="text-[#0d151c] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Neighborhood Insights
            </h2>
            <p className="text-[#0d151c] text-base font-normal leading-normal pb-3 pt-1 px-4">
              Explore the neighborhood around this property with insights from
              various sources.
            </p>

            {/* Tabs */}
            <div className="pb-3">
              <div className="flex border-b border-[#cedde8] px-4 gap-8">
                {neighborhoodData.tabs.map((tab, index) => (
                  <button
                    key={index}
                    className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 font-bold text-sm tracking-[0.015em] ${
                      activeTab === index
                        ? "border-b-[#2597f4] text-[#0d151c]"
                        : "border-b-transparent text-[#49779c]"
                    }`}
                    onClick={() => setActiveTab(index)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="flex flex-col p-4 gap-3">
              {neighborhoodData.insights.map((insight, index) => (
                <details
                  key={index}
                  className="flex flex-col rounded-lg border border-[#cedde8] bg-slate-50 px-[15px] py-[7px] group"
                  open
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-6 py-2">
                    <p className="text-[#0d151c] text-sm font-medium leading-normal">
                      {insight.title}
                    </p>
                    <div className="text-[#0d151c] group-open:rotate-180 transition-transform">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20px"
                        height="20px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                      >
                        <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                      </svg>
                    </div>
                  </summary>
                  <p className="text-[#49779c] text-sm font-normal leading-normal pb-2">
                    {insight.content}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* sdfgsf*/}
        </div>
      </main>
    </div>
  );
};

export default Property;

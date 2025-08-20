import React, { useState } from "react";

const GyaanSathi = () => {
  const [searchValue, setSearchValue] = useState("");
  const [heroSearchValue, setHeroSearchValue] = useState("");

  const courses = [
    {
      id: 1,
      title: "Mathematics 101",
      description: "Learn the basics of mathematics",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCoLZTYcBGpaNFaVspLkHPlA5oLYUlSfqQvje26HhjgFJt4hKj4vKpzJbXaNVrejqgeTT54INIs5ZOYRR83RvnPcLwNU6FKXq47tUHXL34gvupSfUY57lBRdFQ3nonWZcU4Csth83YpWzR1Oz4MxNB4FzM65yN79hs-xcbcAptLwzh6Ix5nsxwURpHwc5KVXdIwT0QHYPDPd5f1D-CQIw9ikWPoCOOovhaRsEYf--b15ENyhTPYrR3FF686uAsRh7OmXQAAUpMf5iw",
    },
    {
      id: 2,
      title: "Physics for Beginners",
      description: "Introduction to physics concepts",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAX3PpK2DHKlgawBntYkfF_QL0_sxIgDZP6dyoTi4Td5OyrHvUFUlAIVYoCsqmNcRAhOzczRcslN0BGgC5z726TTJWNfAAbU3g6Gp9FWIksoxigXGcEfORkhgGGk5lIK3mKf4yxrOJh758q4W4Jv2nfyxraNWCSL_WIG3zmy4v8zvYtnUR2U2U2Vs5OIQrynXDvZsKvj04HM3jMH6I_YUwGOqbwTHKZ5oIXStviAUGqvYVJVtjGq4F0aDcZKkd6PtvcCn-AXX9Ir7Q",
    },
    {
      id: 3,
      title: "Chemistry Fundamentals",
      description: "Fundamentals of chemistry",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDMiFYfIHOXEqS43seeOs1gVmtHsHxutbGDGJtv6RoHPgsO52QGCFo_KUpDuPuQ21y23IFmIW2U-0f4gdzJlHv1H1YZrNj2hTysgkfJtK3F-tOrr37JFty67ecSGb4Ja7YVuE-Y0zEGi-aSTw7Ff8ZlfJjAuqRVgpWjvQbBVo4fiUZg0oFXj5VDodxMctUTVZbNWh3dg1LidbomlnYzp7B_Nd_EjyM7kvV8yuoNL9aAOonxXpNOY7s8TmpfzA5G4vxM01xSjMOZIOs",
    },
    {
      id: 4,
      title: "Biology Essentials",
      description: "Essentials of biology",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAUyTho3twCk5xTnqo5Si7yiFZL_sgf6I_V5-7pd3xzhTixOUoR75lRjC8NRVIew9u4rkYWvGFOTJWV2VwA5l-2xSo17NweKn-cVaIXCvTtXdNIbMr5t_nujJ9c4Xow_dBhEgB-MUe-9nJYo3Da2lKH99GIGTl8yRYh4JBj_9NZZ8M7bjl_pAtXwR_a7hig0pWlAyJ17l45F8vd6SrPRK4v183TnGlr6gdsdcG5b6N3STzxWRpePjdSCbQyOoqEhsrTneqQy8FEeEw",
    },
  ];

  const educators = [
    {
      id: 1,
      name: "Dr. Anya Sharma",
      title: "Mathematics Expert",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB335HTNXcJg9g8zKreUu810pORSPTWgY426v_yZxx-U228hommca8ptKH6GXU5--lGG4E53WjfKzmmIRBLfzxpuNJrG89jNk8O3eVTS8RE0-YXUj1A36iMnWZfupt-4X1gQWF0vPJa-0n0LEeQnEqyZI-TlDtV4zjB3D2J0Hiyau4mORA4_5cDAOVb5YxxQT97be3IgrMb47p7mKfIv4-b-WrvMt07gdjMJXxDrswGzUPSJuRj5rnXM1YMVzX7S_o0oN5FWaq04YU",
    },
    {
      id: 2,
      name: "Prof. Rohan Verma",
      title: "Physics Professor",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBq514IGt1nXXo6gkDphZJuYku10QJq0IDL3E7mywnRgwDl9wMzXl0soWMLIMvWHyu3D-3dBboyDSjLZgM6SNxTL2qRa714sIK3PUbBiINguWssX-H2O16cNdyU06LbKn7I4t-thOfHg2XK_nhB3ki9QiwhDMrUeTT36hQfBT3lN8yWqDDEuKzcuHqqKh3xZQUgjHHdaWJadg7a7JBzRZ9T0K7541OWznOmjkC2Kkr65hejktQ3B676mCQsNJluAhw6F4ZR7t6kv3E",
    },
    {
      id: 3,
      name: "Ms. Divya Kapoor",
      title: "Chemistry Instructor",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCz-Mrnmnf5lmZhtfbQnrjFgblv7SzrHtNToOkny9rgIW_yJsIU8LbNLRtev7LPexdwi8mvwHiGStW4YKdugckU-BuRVU51iM0Pjz-nubQMjRYMPncJHyBniPHXjXVj2_3sydK-treWxRXZTTInRzFgMN_3urdFnb8qVG-G5DldsmrZgjE5qzMsT2OcKeShbmWXEN011WgNuF0itGijtwu1qmg0y4mTwmQlRrQDsEuPzdyHtTFUg6HL9OKLa1oAAmAeYt0V5bKnapg",
    },
  ];

  const handleHeaderSearch = () => {
    console.log("Header search:", searchValue);
  };

  const handleHeroSearch = () => {
    console.log("Hero search:", heroSearchValue);
  };

  const MagnifyingGlassIcon = ({ size = "24px" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 256 256"
    >
      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
    </svg>
  );

  const LogoIcon = () => (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
    >
      <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor" />
    </svg>
  );

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden font-inter">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-10 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 text-gray-900">
              <LogoIcon />
              <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight">
                GyaanSathi
              </h2>
            </div>
            <nav className="flex items-center gap-9">
              <a
                className="text-gray-900 text-sm font-medium leading-normal hover:text-blue-600 cursor-pointer"
                href="#"
              >
                Home
              </a>
              <a
                className="text-gray-900 text-sm font-medium leading-normal hover:text-blue-600 cursor-pointer"
                href="#"
              >
                Courses
              </a>
              <a
                className="text-gray-900 text-sm font-medium leading-normal hover:text-blue-600 cursor-pointer"
                href="#"
              >
                Educators
              </a>
              <a
                className="text-gray-900 text-sm font-medium leading-normal hover:text-blue-600 cursor-pointer"
                href="#"
              >
                About Us
              </a>
            </nav>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            {/* Header Search */}
            <div className="flex flex-col min-w-40 h-10 max-w-64">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div className="text-gray-500 flex border-none bg-gray-100 items-center justify-center pl-4 rounded-l-lg border-r-0">
                  <MagnifyingGlassIcon />
                </div>
                <input
                  placeholder="Search"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-0 border-none bg-gray-100 focus:border-none h-full placeholder:text-gray-500 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleHeaderSearch()}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-blue-600 text-slate-50 text-sm font-bold leading-normal tracking-wide hover:bg-blue-700 transition-colors">
                <span className="truncate">Sign Up</span>
              </button>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 text-gray-900 text-sm font-bold leading-normal tracking-wide hover:bg-gray-200 transition-colors">
                <span className="truncate">Login</span>
              </button>
            </div>
          </div>
        </header>

        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Hero Section */}
            <div className="container">
              <div className="p-4">
                <div
                  className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-lg items-center justify-center p-4 gap-8"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDbrpJgV6Bh2v97nPTVEmMPQEtIbeKyttBYkcrBmW9xbVdMCPRP1XXVnpfVe7qTU1b_voTeZIPg9QsajQcNdQRhpiDrIflMdlLrOFbz3_lIYk0C0CjN3bvOqhErAsse0rr3NKuNza9spMQbZv9a_SD9DUXKBnyovH-bWVoydVZf4kKB76B5p134rWCPO9_aSEJsFjfKpj-x9RjnkKV069kHTFQS6UAGA_NXROfr3NsMIW3pmG-gEI3S0th1ggiefni1SOhpogfP-hg")`,
                  }}
                >
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-white text-4xl font-black leading-tight tracking-tight md:text-5xl">
                      Unlock Your Potential with GyaanSathi
                    </h1>
                    <h2 className="text-white text-sm font-normal leading-normal md:text-base">
                      Access a vast library of study materials and AI-generated
                      notes to enhance your learning experience.
                    </h2>
                  </div>
                  {/* Hero Search */}
                  <div className="flex flex-col min-w-40 h-14 w-full max-w-[480px] md:h-16">
                    <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                      <div className="text-gray-500 flex border border-gray-300 bg-slate-50 items-center justify-center pl-4 rounded-l-lg border-r-0">
                        <MagnifyingGlassIcon size="20px" />
                      </div>
                      <input
                        placeholder="Search for courses"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-0 border border-gray-300 bg-slate-50 focus:border-gray-300 h-full placeholder:text-gray-500 px-4 rounded-r-none border-r-0 pr-2 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal md:text-base"
                        value={heroSearchValue}
                        onChange={(e) => setHeroSearchValue(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleHeroSearch()
                        }
                      />
                      <div className="flex items-center justify-center rounded-r-lg border-l-0 border border-gray-300 bg-slate-50 pr-2">
                        <button
                          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 md:h-12 md:px-5 bg-blue-600 text-slate-50 text-sm font-bold leading-normal tracking-wide md:text-base hover:bg-blue-700 transition-colors"
                          onClick={handleHeroSearch}
                        >
                          <span className="truncate">Search</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Courses Section */}
            <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-tight px-4 pb-3 pt-5">
              Popular Courses
            </h2>
            <div className="flex overflow-x-auto scrollbar-hide">
              <div className="flex items-stretch p-4 gap-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60 hover:transform hover:scale-105 transition-transform cursor-pointer"
                  >
                    <div
                      className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex flex-col"
                      style={{ backgroundImage: `url("${course.image}")` }}
                    />
                    <div>
                      <p className="text-gray-900 text-base font-medium leading-normal">
                        {course.title}
                      </p>
                      <p className="text-gray-500 text-sm font-normal leading-normal">
                        {course.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Educators Section */}
            <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-tight px-4 pb-3 pt-5">
              Featured Educators
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              {educators.map((educator) => (
                <div
                  key={educator.id}
                  className="flex flex-col gap-3 text-center pb-3 hover:transform hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="px-4">
                    <div
                      className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-full"
                      style={{ backgroundImage: `url("${educator.image}")` }}
                    />
                  </div>
                  <div>
                    <p className="text-gray-900 text-base font-medium leading-normal">
                      {educator.name}
                    </p>
                    <p className="text-gray-500 text-sm font-normal leading-normal">
                      {educator.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GyaanSathi;

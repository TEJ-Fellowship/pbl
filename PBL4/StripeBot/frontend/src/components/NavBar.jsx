import React from "react";

const NavBar = () => {
  return (
    <header className="w-full px-5 py-4 bg-gray-100">
      <div className="flex items-center gap-2">
        <img
          src="/stripebot-icon.png"
          alt="StripeBot logo"
          className="h-7 w-7"
        />
        <h1 className="m-0 text-2xl text-[#516498] font-bold">StripeBot</h1>
      </div>
    </header>
  );
};

export default NavBar;

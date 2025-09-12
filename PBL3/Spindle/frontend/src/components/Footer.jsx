// import React from "react";

function Footer() {
    return (
      <footer className="bg-[#FFFBF8]">
        {/* Full-width horizontal line */}
        <div className="w-full">
          <hr className="h-px bg-gray-200 dark:bg-gray-700 border-0" />
        </div>
  
        {/* Footer content aligned with container */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            {/* Copyright */}
            <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
              © {new Date().getFullYear()}{" "}
              <a href="#" className="hover:underline">
                Spindle™
              </a>
              . All Rights Reserved.
            </span>
  
            {/* Links */}
            <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400">
              <li>
                <a href="#" className="hover:underline me-4 md:me-6">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline me-4 md:me-6">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    );
  }
  
  export default Footer;
  



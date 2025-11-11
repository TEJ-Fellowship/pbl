import React from "react";
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
                QuickPick™
              </a>
              . All Rights Reserved - "Project by Ashok & Binita"
            </span>
          </div>
        </div>
      </footer>
    );
  }
  
  export default Footer;
  



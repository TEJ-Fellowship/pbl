import React from 'react'
import { Button, Input, Textarea, Typography } from "@material-tailwind/react";
import "bootstrap-icons/font/bootstrap-icons.css";


const Contact = () => {
  return (
    <>
      <div className="fixed bottom-0 w-full bg-white">
        <div className="max-w-screen-xl px-4 py-9 mx-auto space-y-7 overflow-hidden sm:px-6 lg:px-8">
          <footer className="flex flex-wrap justify-center -mx-5 -my-2">
            <div className="px-5 py-2">
              <a
                href="/about"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                About
              </a>
            </div>
            <div className="px-5 py-2">
              <a
                href="#"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Privacy Policy
              </a>
            </div>
            <div className="px-5 py-2">
              <a
                href="#"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Terms
              </a>
            </div>
            <div className="px-5 py-2">
              <a
                href="/contact"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Contact
              </a>
            </div>
          </footer>
          <div className="flex justify-center mt-4 space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Facebook</span>
              <i className="bi bi-facebook text-2xl"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Instagram</span>
              <i className="bi bi-instagram text-2xl"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Twitter</span>
              <i className="bi bi-twitter text-2xl"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">GitHub</span>
              <i className="bi bi-github text-2xl"></i>
            </a>
          </div>
          <p className="mt-5 text-base leading-2 text-center text-gray-700">
            © 2025 MA Properties Inc., All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}

export default Contact
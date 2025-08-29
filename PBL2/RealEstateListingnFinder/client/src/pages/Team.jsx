import React from "react";
import Mahesh from "../assets/Mahesh_Photo.jpg";
import Anish from "../assets/Anish.jpg";
import "bootstrap-icons/font/bootstrap-icons.css";

import { Facebook, Github, Instagram, Twitter } from "lucide-react";

const iconMap = {
  facebook:
    "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z",
  github:
    "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
};

const teamMembers = [
  {
    id: 1,
    name: "Mahesh Chaudhary",
    role: "CEO & Founder @ Lakshya Incorp. || Full Stack Developer",
    img: Mahesh,
    sociallink: {
      facebook: "https://www.facebook.com/initx.mahesh/",
      github: "https://www.github.com/initxmahesh/",
    },
    description:
      "He has a positive mindset to bring change and give back to the community.",
  },
  {
    id: 2,
    name: "Anish Shrestha",
    role: "Full Stack Developer",
    img: Anish,
    sociallink: {
      facebook: "https://www.facebook.com/anish.shrestha.571447",
      github: "https://github.com/anish-X",
    },
    description:
      "He is Co-Founder of MA Properties Inc. and a professional fullstack web developer.",
  },
];

const Team = () => {
  return (
    <>
      <section className="bg-white dark:bg-gray-900 pl-24 pr-24 mt-16">
        <div className="text-center mb-8 lg:mb-16">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            Our Team
          </h2>
          <p className="font-light text-gray-500 lg:mb-16 sm:text-xl dark:text-gray-400">
            Meet the Dynamic Team behind this newly launched product.
          </p>
        </div>

        <div className="grid gap-8 mb-6 lg:mb-16 md:grid-cols-2">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="items-center bg-gray-50 rounded-lg shadow sm:flex dark:bg-gray-800 dark:border-gray-700"
            >
              <img
                className="w-80 h-full object-cover rounded-lg sm:rounded-none sm:rounded-l-lg"
                src={member.img}
                alt={`${member.name} Avatar`}
              />
              <div className="p-5">
                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {member.name}
                </h3>
                <span className="text-gray-500 dark:text-gray-400">
                  {member.role}
                </span>
                <p className="mt-3 mb-4 font-light text-gray-500 dark:text-gray-400">
                  {member.description}
                </p>
                <ul className="flex space-x-3 sm:mt-0">
                  {member.sociallink &&
                    Object.entries(member.sociallink).map(([key, url]) => {
                      const path = iconMap[key];
                      return (
                        <li key={key}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d={path} />
                            </svg>
                          </a>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
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
};

export default Team;

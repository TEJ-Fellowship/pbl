import React from 'react';
import { Star, Check, Facebook, Twitter, Instagram, Github } from 'lucide-react';

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    username: "@sarahjohnson",
    verified: true,
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    content: "Working with MA Properties made our home buying process incredibly smooth. Their attention to detail and market knowledge helped us find our dream home at the right price.",
    date: "Jan 17, 2025",
  },
  {
    id: 2,
    name: "Michael Chen",
    username: "@michaelchen",
    verified: true,
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    content: "The property search features on MA Properties are unmatched. I could filter exactly what I needed in terms of location, price, and amenities. Found my apartment within days!",
    date: "Jan 18, 2025",
  },
  {
    id: 3,
    name: "Emma Williams",
    username: "@emmawilliams",
    verified: true,
    avatar: "https://randomuser.me/api/portraits/women/45.jpg",
    content: "As a first-time seller, I was nervous about the process. MA Properties guided me through every step and got me 15% above my asking price. Couldn't be happier!",
    date: "Jan 19, 2025",
  },
  {
    id: 4,
    name: "James Rodriguez",
    username: "@jamesrodriguez",
    verified: true,
    avatar: "https://randomuser.me/api/portraits/men/36.jpg",
    content: "Their agent was incredibly responsive and understood exactly what we were looking for. The virtual tours saved us so much time during our relocation. Highly recommend!",
    date: "Jan 20, 2025",
  },
  {
    id: 5,
    name: "Priya Patel",
    username: "@priyapatel",
    verified: true,
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    content: "MA Properties platform is intuitive and provides comprehensive information about each listing. The neighborhood insights and school ratings were particularly helpful for our family.",
    date: "Jan 21, 2025",
  },
  {
    id: 6,
    name: "David Thompson",
    username: "@davidthompson",
    verified: true,
    avatar: "https://randomuser.me/api/portraits/men/29.jpg",
    content: "The mortgage calculator and pre-approval process through MA Properties partners saved me thousands in interest. Their financial guidance was invaluable in making my purchase decision.",
    date: "Jan 22, 2025",
  }
];

const TestimonialCard = ({ testimonial }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 transition-shadow hover:shadow-md">
      <div className="flex items-center mb-4">
        <img 
          src={testimonial.avatar} 
          alt={testimonial.name} 
          className="w-12 h-12 rounded-full object-cover mr-4"
        />
        <div>
          <div className="flex items-center">
            <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
            {testimonial.verified && (
              <span className="ml-1 text-teal-500">
                <Check className="w-4 h-4" />
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{testimonial.username}</p>
        </div>
      </div>

      <p className="text-gray-700 mb-4">
        {testimonial.content}
      </p>
      
      <div className="flex items-center text-lg mb-2">
        <span role="img" aria-label="emoji">{testimonial.icon}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-teal-600">
          <Star className="w-4 h-4 fill-current" />
          <Star className="w-4 h-4 fill-current" />
          <Star className="w-4 h-4 fill-current" />
          <Star className="w-4 h-4 fill-current" />
          <Star className="w-4 h-4 fill-current" />
        </div>
        <span className="text-sm text-gray-500">
          {testimonial.date}
        </span>
      </div>
    </div>
  );
};

const Reviews = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-white pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Testimonials</h1>
          <div className="w-24 h-1 bg-teal-600 mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            What Our Clients Say
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 text-lg">
            Real stories from real clients who found their perfect properties through our platform.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-teal-700 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-white mb-1">98%</div>
              <div className="text-teal-100 text-sm">Client Satisfaction</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-white mb-1">5,200+</div>
              <div className="text-teal-100 text-sm">Happy Customers</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-white mb-1">12,000+</div>
              <div className="text-teal-100 text-sm">Properties Sold</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-white mb-1">15+ Years</div>
              <div className="text-teal-100 text-sm">Of Experience</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl px-4 py-8 mx-auto space-y-5 overflow-hidden sm:px-6 lg:px-8">
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
    </div>
  );
}

export default Reviews
import {
  Facebook,
  Instagram,
  Twitter,
  Github,
  MapPin,
  Users,
  Building,
  Award,
  Check,
  Clock,
  Phone,
  Mail,
} from "lucide-react";
import React from "react";
import about from "../assets/about.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative h-[600px] bg-cover bg-center flex items-center"
        style={{ backgroundImage: `url(${about})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            About Us
          </h1>
          <div className="w-24 h-1 bg-teal-500 mx-auto mb-8"></div>

          <div className="max-w-3xl mx-auto">
            <p className="text-white text-xl mb-8">
              The #1 site real estate professionals trust*
            </p>
            <p className="text-white text-lg mb-10">
              Since 2015, we've been helping clients find their perfect home and
              make informed real estate decisions through our innovative
              platforms and dedicated team of professionals.
            </p>
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="bg-teal-500 h-1 w-8 rounded-full"></div>
              <p className="text-white font-medium">
                Find Your Dream Home
              </p>
              <div className="bg-teal-500 h-1 w-8 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Welcome to MA Properties
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                At MA Properties, we believe finding your ideal property should
                be a journey of discovery, not a source of stress. Our platform
                combines cutting-edge technology with personalized service to
                create a seamless real estate experience.
              </p>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Whether you're buying your first home, investing in commercial
                property, or looking for the perfect rental, our dedicated team
                and innovative tools are designed to support you at every step
                of your real estate journey.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-teal-50 p-6 rounded-lg">
                <h3 className="font-bold text-teal-800 text-xl mb-2">15+</h3>
                <p className="text-gray-600">Years of Experience</p>
              </div>
              <div className="bg-teal-50 p-6 rounded-lg">
                <h3 className="font-bold text-teal-800 text-xl mb-2">50+</h3>
                <p className="text-gray-600">Expert Agents</p>
              </div>
              <div className="bg-teal-50 p-6 rounded-lg">
                <h3 className="font-bold text-teal-800 text-xl mb-2">2500+</h3>
                <p className="text-gray-600">Happy Clients</p>
              </div>
              <div className="bg-teal-50 p-6 rounded-lg">
                <h3 className="font-bold text-teal-800 text-xl mb-2">98%</h3>
                <p className="text-gray-600">Client Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Our Achievements
            </h2>
            <div className="w-20 h-1 bg-teal-600 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-5xl font-bold text-teal-600 mb-3">680+</div>
              <div className="text-gray-700 font-medium">
                Award Winning Projects
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-5xl font-bold text-teal-600 mb-3">8K+</div>
              <div className="text-gray-700 font-medium">Happy Customers</div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-5xl font-bold text-teal-600 mb-3">500+</div>
              <div className="text-gray-700 font-medium">Properties Ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Mission */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Mission & Values
            </h2>
            <div className="w-20 h-1 bg-teal-600 mx-auto mb-6"></div>
            <p className="max-w-3xl mx-auto text-gray-700">
              At MA Properties, we're committed to transforming the real estate
              experience through technology, transparency, and exceptional
              service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-teal-100 w-14 h-14 flex items-center justify-center rounded-full mb-6 mx-auto">
                <MapPin className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                Local Expertise
              </h3>
              <p className="text-gray-700 text-center">
                Our team has deep knowledge of local markets, giving you the
                competitive edge in buying or selling properties.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-teal-100 w-14 h-14 flex items-center justify-center rounded-full mb-6 mx-auto">
                <Users className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                Client-Focused
              </h3>
              <p className="text-gray-700 text-center">
                We prioritize your needs and goals, ensuring a personalized
                experience tailored to your specific requirements.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-teal-100 w-14 h-14 flex items-center justify-center rounded-full mb-6 mx-auto">
                <Building className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                Innovation
              </h3>
              <p className="text-gray-700 text-center">
                Our cutting-edge technology provides tools that make property
                search, management, and transactions seamless.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose MA Properties
            </h2>
            <div className="w-24 h-1 bg-teal-600 mb-6 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-start mb-8">
                <div className="bg-teal-100 p-2 rounded-full mr-4">
                  <Award className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Award-Winning Service
                  </h3>
                  <p className="text-gray-600">
                    Our dedication to excellence has earned us industry
                    recognition and countless satisfied clients.
                  </p>
                </div>
              </div>

              <div className="flex items-start mb-8">
                <div className="bg-teal-100 p-2 rounded-full mr-4">
                  <Check className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Verified Listings
                  </h3>
                  <p className="text-gray-600">
                    Every property on our platform undergoes thorough
                    verification to ensure accuracy and quality.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-teal-100 p-2 rounded-full mr-4">
                  <Clock className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    24/7 Support
                  </h3>
                  <p className="text-gray-600">
                    Our team is always available to assist with your queries and
                    provide guidance at any time.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Get in Touch
              </h3>
              <div className="flex items-center mb-4">
                <Phone className="w-5 h-5 text-teal-600 mr-3" />
                <span className="text-gray-700">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center mb-4">
                <Mail className="w-5 h-5 text-teal-600 mr-3" />
                <span className="text-gray-700">contact@maproperties.com</span>
              </div>
              <div className="flex items-center mb-8">
                <MapPin className="w-5 h-5 text-teal-600 mr-3" />
                <span className="text-gray-700">
                  123 Real Estate Ave, Property City, PC 12345
                </span>
              </div>

              <div className="flex space-x-4 mt-6">
                <a
                  href="#"
                  className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl px-4 py-9 mx-auto space-y-7 overflow-hidden sm:px-6 lg:px-8">
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
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600">
              <Github className="w-5 h-5" />
            </a>
          </div>
          <p className="mt-5 text-base leading-2 text-center text-gray-700">
            © 2025 MA Properties Inc., All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;

import { MdLogin } from "react-icons/md";
import { Search } from "lucide-react";

const Hero = () => {
    return (
      <section className="relative px-4 pt-14 pb-10 md:pt-24 md:pb-14">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6">
            Your AI-Powered Community
            <span className="block">Assistant</span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
            Automate moderation, answer questions, and manage your Discord server with ease. 
            Need help? Search our knowledge base below.
          </p>

          <div className="mx-auto max-w-2xl">
            <div className="flex items-stretch rounded-lg border border-gray-700 bg-gray-800 overflow-hidden">
              <div className="px-3 hidden sm:flex items-center text-gray-400"><Search size={16} /></div>
              <input
                type="text"
                placeholder="Search for help articles..."
                className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-gray-500"
              />
              <button className="bg-blue-600 px-4 md:px-5 text-sm font-medium hover:bg-blue-500">Search</button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
              <MdLogin />
              <span>Login with Discord</span>
            </button>
            <button className="inline-flex items-center rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Learn More</button>
          </div>
        </div>
      </section>
    );
  };
  
  export default Hero;
  
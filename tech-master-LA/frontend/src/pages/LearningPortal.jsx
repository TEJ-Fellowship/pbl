import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay, Pagination } from "swiper/modules";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Code,
  Sparkles,
  Waypoints,
  ArrowRight,
  BrainCircuit,
} from "lucide-react";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

import { AI_CHAT, SMART_QUIZZES, TRACK_PROGRESS } from "../constants/routes";
import { useAuth } from "../context/AuthContext";

const slideData = [
  {
    icon: BrainCircuit,
    title: "AI-Powered Conversations",
    subtitle:
      "Engage with our advanced AI tutor. Ask complex questions, get detailed explanations, and deepen your understanding of any topic.",
    image:
      "https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonText: "Start Chatting",
    link: AI_CHAT,
    gradient: "from-blue-500/80 to-purple-500/80",
  },
  {
    icon: Sparkles,
    title: "Smart Quiz Generation",
    subtitle:
      "Turn any topic or conversation into a custom quiz. Test your knowledge, identify weak spots, and accelerate your learning.",
    image:
      "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonText: "Create a Quiz",
    link: SMART_QUIZZES,
    gradient: "from-green-500/80 to-teal-500/80",
  },
  {
    icon: Waypoints,
    title: "Track Your Progress",
    subtitle:
      "Monitor your performance over time. See your scores, review past quizzes, and watch your skills grow with our detailed analytics.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonText: "View Stats",
    link: TRACK_PROGRESS,
    gradient: "from-yellow-500/80 to-orange-500/80",
  },
  {
    icon: Code,
    title: "Master New Technologies",
    subtitle:
      "From frameworks to algorithms, our platform is designed to help you conquer the latest in tech. Dive in and start your journey.",
    image:
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonText: "Explore Topics",
    link: AI_CHAT,
    gradient: "from-red-500/80 to-pink-500/80",
  },
];

const ActionCard = ({ icon, title, description, link, color }) => {
  const navigate = useNavigate();
  const Icon = icon;
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={() => navigate(link)}
      className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-start cursor-pointer h-full"
    >
      <div className={`p-3 rounded-lg bg-${color}-500/20`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      <h3 className="text-xl font-bold mt-4 text-white">{title}</h3>
      <p className="text-gray-400 mt-2 flex-grow">{description}</p>
      <div className="mt-4 text-red-400 flex items-center group">
        Go to {title}
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
};

const LearningPortal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex-grow w-full h-full relative bg-gray-900 overflow-hidden text-white">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-black to-gray-900 animate-gradient-x"></div>
      </div>

      <div className="relative z-10 w-full h-full p-8 overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold">
            Welcome,{" "}
            <span className="text-red-500">{user?.name || "Learner"}</span>!
          </h1>
          <p className="text-lg text-gray-400 mt-2">
            Your journey to mastery starts now. What will you learn today?
          </p>
        </motion.div>

        {/* Swiper */}
        <div className="h-[60vh] flex items-center justify-center">
          <Swiper
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={"auto"}
            loop={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            coverflowEffect={{
              rotate: 0,
              stretch: 80,
              depth: 200,
              modifier: 1,
              slideShadows: false,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            modules={[EffectCoverflow, Autoplay, Pagination]}
            className="w-full h-full"
          >
            {slideData.map((slide, index) => (
              <SwiperSlide key={index} style={{ width: "65%", height: "95%" }}>
                <Tilt
                  className="w-full h-full"
                  tiltMaxAngleX={5}
                  tiltMaxAngleY={5}
                  perspective={1000}
                  glareEnable={true}
                  glareMaxOpacity={0.1}
                  glarePosition="all"
                >
                  <div className="w-full h-full bg-black/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                    <div className="grid md:grid-cols-2 h-full">
                      {/* Image Section */}
                      <div className="relative w-full h-full">
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url('${slide.image}')` }}
                        ></div>
                        <div
                          className={`absolute inset-0 bg-gradient-to-t ${slide.gradient} mix-blend-hard-light`}
                        ></div>
                      </div>

                      {/* Content Section */}
                      <div className="p-8 md:p-12 flex flex-col justify-center text-white">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/10 rounded-lg">
                              <slide.icon className="w-6 h-6 text-red-400" />
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
                              {slide.title}
                            </h2>
                          </div>
                          <p className="mt-4 text-gray-300 text-lg leading-relaxed">
                            {slide.subtitle}
                          </p>
                          <button
                            onClick={() => navigate(slide.link)}
                            className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white transition-transform duration-300 ease-in-out hover:scale-105 shadow-lg"
                          >
                            {slide.buttonText}
                          </button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </Tilt>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Quick Access Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            Or jump right in...
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ActionCard
              icon={BrainCircuit}
              title="AI Chat"
              description="Get instant help from your AI tutor on any subject."
              link={AI_CHAT}
              color="blue"
            />
            <ActionCard
              icon={Sparkles}
              title="Smart Quizzes"
              description="Generate custom quizzes to test your knowledge."
              link={SMART_QUIZZES}
              color="green"
            />
            <ActionCard
              icon={Waypoints}
              title="Track Progress"
              description="Analyze your performance and see how far you've come."
              link={TRACK_PROGRESS}
              color="yellow"
            />
          </div>
        </motion.div>
      </div>
      <style>{`
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5) !important;
          width: 10px;
          height: 10px;
          opacity: 0.7;
        }
        .swiper-pagination-bullet-active {
          background: #ef4444 !important;
          opacity: 1;
        }
        @keyframes gradient-x {
            0%, 100% {
                background-size: 200% 200%;
                background-position: left center;
            }
            50% {
                background-size: 200% 200%;
                background-position: right center;
            }
        }
        .animate-gradient-x {
            animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default LearningPortal;

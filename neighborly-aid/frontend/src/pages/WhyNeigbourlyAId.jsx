import React, { useContext } from "react";
import {  useScroll, useTransform } from "framer-motion";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MY_NEIGHBOURHOOD , LEADERBOARD , LOGIN_ROUTE } from "../constants/routes";
import AuthContext from "../context/AuthContext";

import {
  Heart,
  Users,
  Shield,
  Award,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Globe,
  TrendingUp,
} from "lucide-react";

const WhyNeigbourlyAId = () => {
  const { user } = useContext(AuthContext);
  const containerRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const navigate = useNavigate();
  const handleGetStarted = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (user) {
      navigate(MY_NEIGHBOURHOOD);
    } else {
      navigate(LOGIN_ROUTE);
    }
  };
  const handleLearnMore = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (user) {
      navigate(LEADERBOARD);
    } else {
      navigate(LOGIN_ROUTE);
    }
  };

  const handleLogin = () => {
    navigate(LOGIN_ROUTE);
  };
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const features = [
    {
      icon: <Heart className="text-primary" size={32} />,
      title: "Community First",
      description: "Building stronger, more connected neighborhoods where everyone looks out for each other.",
      color: "from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20"
    },
    {
      icon: <Shield className="text-primary" size={32} />,
      title: "Safe & Secure",
      description: "Verified users and secure platform ensuring trust and safety in every interaction.",
      color: "from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20"
    },
    {
      icon: <Clock className="text-primary" size={32} />,
      title: "Quick & Easy",
      description: "Get help or offer assistance in minutes with our streamlined platform.",
      color: "from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20"
    },
    {
      icon: <MapPin className="text-primary" size={32} />,
      title: "Local Focus",
      description: "Connect with neighbors in your immediate area for convenient, reliable help.",
      color: "from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20"
    }
  ];

  const benefits = [
    {
      icon: <Users className="text-primary" size={24} />,
      title: "Build Relationships",
      description: "Meet and connect with people in your neighborhood, creating lasting friendships."
    },
    {
      icon: <Award className="text-primary" size={24} />,
      title: "Earn Karma Points",
      description: "Gain recognition and build reputation through helpful actions in your community."
    },
    {
      icon: <CheckCircle className="text-primary" size={24} />,
      title: "Verified Community",
      description: "All users are verified to ensure a safe and trustworthy environment."
    },
    {
      icon: <TrendingUp className="text-primary" size={24} />,
      title: "Growing Network",
      description: "Join thousands of active users helping each other across communities."
    }
  ];

  const stats = [
    { number: "100+", label: "Active Users", icon: <Users className="text-primary" size={20} /> },
    { number: "50+", label: "Tasks Completed", icon: <CheckCircle className="text-primary" size={20} /> },
    { number: "95%", label: "Satisfaction Rate", icon: <Star className="text-primary" size={20} /> },
    { number: "1+", label: "Communities", icon: <MapPin className="text-primary" size={20} /> }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Join Your Community",
      description: "Sign up and connect with your local neighborhood community.",
      icon: <Users className="text-primary" size={24} />
    },
    {
      step: "2",
      title: "Post or Offer Help",
      description: "Request assistance or volunteer to help others in your area.",
      icon: <Heart className="text-primary" size={24} />
    },
    {
      step: "3",
      title: "Connect & Help",
      description: "Match with neighbors and complete tasks together.",
      icon: <CheckCircle className="text-primary" size={24} />
    },
    {
      step: "4",
      title: "Build Karma",
      description: "Earn points and build your reputation in the community.",
      icon: <Award className="text-primary" size={24} />
    }
  ];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -100 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 100 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const floatAnimation = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div ref={containerRef}
     className="min-h-screen bg-green-50 dark:bg-background-humbleDark dark:text-text-spotlight overflow-hidden relative"
     style={{ position: "relative" }}
     >
            {/* Login Button - Top Right */}
            {!user && (
        <motion.div
          className="fixed top-6 right-6 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.button
            className="bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl border border-gray-200"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
          >
            Login
          </motion.button>
        </motion.div>
      )}
      {/* Parallax Background */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{ y: backgroundY }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
      </motion.div>
      
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-16">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full text-sm font-medium mb-6"
              variants={scaleIn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button onClick={handleGetStarted} className="flex items-center gap-2">
              <Lightbulb className="size-4" />
              {user ? "Explore Our Neighbourhood" : "Building Stronger Communities"}
              </button>
            </motion.div>
            <motion.h1 
              className="text-5xl md:text-6xl font-bold text-text-dark dark:text-text-spotlight mb-6"
              variants={fadeInUp}
            >
              Why Choose
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Neighbourly Aid</span>?
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-text-light dark:text-text-spotlight/80 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              We're revolutionizing how neighbors connect and support each other. 
              Join thousands of people building stronger, more caring communities.
            </motion.p>
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="flex items-center justify-center gap-2 mb-2"
                  variants={floatAnimation}
                  animate="animate"
                >
                  {stat.icon}
                  <span className="text-3xl md:text-4xl font-bold text-text-dark dark:text-text-spotlight">
                    {stat.number}
                  </span>
                </motion.div>
                <p className="text-sm text-text-light dark:text-text-spotlight/70">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        className="max-w-6xl mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div 
          className="text-center mb-12"
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold text-text-dark dark:text-text-spotlight mb-4">
            What Makes Us Special
          </h2>
          <p className="text-lg text-text-light dark:text-text-spotlight/70 max-w-2xl mx-auto">
            Discover the unique features that make Neighbourly Aid the perfect platform for community building
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className={`bg-gradient-to-br ${feature.color} rounded-2xl p-6 border border-border dark:border-border-dark hover:shadow-lg transition-all duration-300`}
              variants={slideInLeft}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-semibold text-text-dark dark:text-text-spotlight mb-2">
                {feature.title}
              </h3>
              <p className="text-text-light dark:text-text-spotlight/70">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* How It Works Section */}
      <motion.div 
        className="max-w-6xl mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div 
          className="text-center mb-12"
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold text-text-dark dark:text-text-spotlight mb-4">
            How It Works
          </h2>
          <p className="text-lg text-text-light dark:text-text-spotlight/70 max-w-2xl mx-auto">
            Get started in just a few simple steps
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
        >
          {howItWorks.map((step, index) => (
            <motion.div 
              key={index} 
              className="relative"
              variants={slideInRight}
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-background dark:bg-background-politeDark rounded-2xl p-6 border border-border dark:border-border-dark hover:shadow-lg transition-all duration-300">
                <motion.div 
                  className="flex items-center gap-3 mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div 
                    className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {step.step}
                  </motion.div>
                  {step.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-text-dark dark:text-text-spotlight mb-2">
                  {step.title}
                </h3>
                <p className="text-text-light dark:text-text-spotlight/70">
                  {step.description}
                </p>
              </div>
              {index < howItWorks.length - 1 && (
                <motion.div 
                  className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2"
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="text-text-light dark:text-text-spotlight/50" size={24} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Benefits Section */}
      <motion.div 
        className="max-w-6xl mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div 
          className="text-center mb-12"
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold text-text-dark dark:text-text-spotlight mb-4">
            Benefits of Joining
          </h2>
          <p className="text-lg text-text-light dark:text-text-spotlight/70 max-w-2xl mx-auto">
            Experience the positive impact of being part of a caring community
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          variants={staggerContainer}
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index} 
              className="flex items-start gap-4"
              variants={index % 2 === 0 ? slideInLeft : slideInRight}
              whileHover={{ x: index % 2 === 0 ? 10 : -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div 
                className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-xl flex items-center justify-center"
                whileHover={{ 
                  scale: 1.2, 
                  rotate: 360,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
                }}
                transition={{ duration: 0.6 }}
              >
                {benefit.icon}
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold text-text-dark dark:text-text-spotlight mb-2">
                  {benefit.title}
                </h3>
                <p className="text-text-light dark:text-text-spotlight/70">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        className="max-w-4xl mx-auto px-4 py-16 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div 
          className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-12 text-white"
          variants={scaleIn}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.h2 
            className="text-4xl font-bold mb-4"
            variants={fadeInUp}
          >
            Ready to Join Your Community?
          </motion.h2>
          <motion.p 
            className="text-xl mb-8 opacity-90"
            variants={fadeInUp}
          >
            Start building connections and making a difference in your neighborhood today.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={staggerContainer}
          >
            <motion.button 
              className="bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
              variants={scaleIn}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
            >
              Get Started Now
            </motion.button>


            <motion.button 
              className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-primary transition-colors"
              variants={scaleIn}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLearnMore}
            >
              Learn More
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Mission Statement */}
      <motion.div 
        className="max-w-4xl mx-auto px-4 py-16 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div 
          className="bg-background dark:bg-background-politeDark rounded-2xl p-8 border border-border dark:border-border-dark"
          variants={fadeInUp}
          whileHover={{ y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Globe className="text-primary mx-auto mb-4" size={48} />
          </motion.div>
          <h3 className="text-2xl font-bold text-text-dark dark:text-text-spotlight mb-4">
            Our Mission
          </h3>
          <p className="text-lg text-text-light dark:text-text-spotlight/70 leading-relaxed">
            To create a world where no one feels alone in their neighborhood. 
            We believe that strong communities are built on the foundation of mutual support, 
            trust, and genuine human connections. Through Neighbourly Aid, we're making it 
            easier than ever for people to help each other and build lasting relationships 
            that make our communities stronger, safer, and more vibrant places to live.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WhyNeigbourlyAId;
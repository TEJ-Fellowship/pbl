import React from "react";
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
    { number: "10,000+", label: "Active Users", icon: <Users className="text-primary" size={20} /> },
    { number: "50,000+", label: "Tasks Completed", icon: <CheckCircle className="text-primary" size={20} /> },
    { number: "95%", label: "Satisfaction Rate", icon: <Star className="text-primary" size={20} /> },
    { number: "500+", label: "Communities", icon: <MapPin className="text-primary" size={20} /> }
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

  return (
    <div className="min-h-screen bg-green-50 dark:bg-background-humbleDark dark:text-text-spotlight">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Lightbulb className="size-4" />
              Building Stronger Communities
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-text-dark dark:text-text-spotlight mb-6">
              Why Choose
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Neighbourly Aid</span>?
            </h1>
            <p className="text-xl md:text-2xl text-text-light dark:text-text-spotlight/80 max-w-3xl mx-auto leading-relaxed">
              We're revolutionizing how neighbors connect and support each other. 
              Join thousands of people building stronger, more caring communities.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {stat.icon}
                  <span className="text-3xl md:text-4xl font-bold text-text-dark dark:text-text-spotlight">
                    {stat.number}
                  </span>
                </div>
                <p className="text-sm text-text-light dark:text-text-spotlight/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-text-dark dark:text-text-spotlight mb-4">
            What Makes Us Special
          </h2>
          <p className="text-lg text-text-light dark:text-text-spotlight/70 max-w-2xl mx-auto">
            Discover the unique features that make Neighbourly Aid the perfect platform for community building
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className={`bg-gradient-to-br ${feature.color} rounded-2xl p-6 border border-border dark:border-border-dark hover:shadow-lg transition-all duration-300`}>
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-text-dark dark:text-text-spotlight mb-2">
                {feature.title}
              </h3>
              <p className="text-text-light dark:text-text-spotlight/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-text-dark dark:text-text-spotlight mb-4">
            How It Works
          </h2>
          <p className="text-lg text-text-light dark:text-text-spotlight/70 max-w-2xl mx-auto">
            Get started in just a few simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-background dark:bg-background-politeDark rounded-2xl p-6 border border-border dark:border-border-dark hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-text-dark dark:text-text-spotlight mb-2">
                  {step.title}
                </h3>
                <p className="text-text-light dark:text-text-spotlight/70">
                  {step.description}
                </p>
              </div>
              {index < howItWorks.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <ArrowRight className="text-text-light dark:text-text-spotlight/50" size={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-text-dark dark:text-text-spotlight mb-4">
            Benefits of Joining
          </h2>
          <p className="text-lg text-text-light dark:text-text-spotlight/70 max-w-2xl mx-auto">
            Experience the positive impact of being part of a caring community
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-xl flex items-center justify-center">
                {benefit.icon}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-dark dark:text-text-spotlight mb-2">
                  {benefit.title}
                </h3>
                <p className="text-text-light dark:text-text-spotlight/70">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Join Your Community?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start building connections and making a difference in your neighborhood today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              Get Started Now
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-primary transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-background dark:bg-background-politeDark rounded-2xl p-8 border border-border dark:border-border-dark">
          <Globe className="text-primary mx-auto mb-4" size={48} />
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
        </div>
      </div>
    </div>
  );
};

export default WhyNeigbourlyAId;
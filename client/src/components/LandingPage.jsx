import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FiArrowRight, FiCode, FiZap, FiGlobe, FiShield, FiLayers, FiStar } from 'react-icons/fi';

// Aceternity UI Grid Background Component
const GridBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
    </div>
  );
};

// Animated gradient orb
const GradientOrb = ({ delay = 0 }) => {
  return (
    <motion.div
      className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
      animate={{
        x: [0, 100, 0],
        y: [0, -100, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      style={{
        background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(59,130,246,0.4) 50%, transparent 70%)',
      }}
    />
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
      <div className="relative">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </motion.div>
  );
};

// Hero Section
const HeroSection = ({ onGetStarted }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <GridBackground />
      <GradientOrb delay={0} />
      <GradientOrb delay={7} />
      <GradientOrb delay={14} />
      
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-block mb-6"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium">
              ✨ AI-Powered Web Builder
            </span>
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight">
            AetherBuild
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Build stunning websites with AI. Describe your vision, and watch it come to life in seconds.
            <br />
            <span className="text-purple-400">No code. No limits. Just pure creativity.</span>
          </p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg flex items-center gap-2 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300"
            >
              Get Started Free
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gray-800/50 border border-gray-700 text-white font-semibold text-lg hover:bg-gray-800 transition-all duration-300"
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Parallax scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-purple-500"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: FiStar,
      title: 'AI-Powered Generation',
      description: 'Describe your vision in plain English. Our AI generates production-ready React code instantly.',
    },
    {
      icon: FiCode,
      title: 'Real-Time Preview',
      description: 'See your changes live as you build. Edit code and watch your app update in real-time.',
    },
    {
      icon: FiZap,
      title: 'Lightning Fast',
      description: 'Build and deploy in minutes, not days. No setup, no configuration, just pure speed.',
    },
    {
      icon: FiGlobe,
      title: 'One-Click Deploy',
      description: 'Deploy your projects to Netlify with a single click. Get a live URL instantly.',
    },
    {
      icon: FiLayers,
      title: 'Full Project Management',
      description: 'Organize your projects, track conversations, and manage your entire workflow in one place.',
    },
    {
      icon: FiShield,
      title: 'Secure & Private',
      description: 'Your code and data are secure. All projects are private to your account.',
    },
  ];

  return (
    <section className="relative py-32 bg-gray-950 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to Build
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to make web development effortless and enjoyable.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = ({ onGetStarted }) => {
  return (
    <section className="relative py-32 bg-gradient-to-b from-gray-950 to-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of developers building the future with AI.
          </p>
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-xl flex items-center gap-3 mx-auto shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300"
          >
            Start Building Now
            <FiArrowRight className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// Main Landing Page Component
const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <CTASection onGetStarted={onGetStarted} />
    </div>
  );
};

export default LandingPage;


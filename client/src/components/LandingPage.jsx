import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { FiArrowRight, FiCode, FiZap, FiGlobe, FiShield, FiLayers, FiStar, FiCheck, FiChevronDown, FiGithub, FiTwitter, FiLinkedin, FiMail, FiUsers, FiTrendingUp, FiAward, FiMenu, FiX, FiMic, FiImage, FiBarChart2, FiPackage, FiMessageCircle, FiCpu, FiSend } from 'react-icons/fi';

// Aceternity UI Grid Background Component
const GridBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
    </div>
  );
};

// Animated gradient orb with enhanced movement
const GradientOrb = ({ delay = 0, className = "", intensity = 1 }) => {
  return (
    <motion.div
      className={`absolute w-96 h-96 rounded-full blur-3xl opacity-20 ${className}`}
      animate={{
        x: [0, 100 * intensity, 0],
        y: [0, -100 * intensity, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 20 + delay,
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

// Marquee Component (like Supermemory.ai)
const Marquee = ({ items, direction = 'left', speed = 50 }) => {
  return (
    <div className="relative overflow-hidden whitespace-nowrap">
      <motion.div
        className="flex gap-8"
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Duplicate items for seamless loop */}
        {[...items, ...items].map((item, index) => (
          <div key={index} className="flex-shrink-0">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// Component Showcase Card for Marquee
const ComponentCard = ({ icon: Icon, name, gradient }) => {
  return (
    <div className={`flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-br ${gradient} border border-white/10 backdrop-blur-sm min-w-[280px]`}>
      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-white font-semibold text-sm">{name}</div>
        <div className="text-white/70 text-xs">Component</div>
      </div>
    </div>
  );
};

// Sticky Navigation
const Navigation = ({ onGetStarted }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent cursor-pointer"
            onClick={() => scrollToSection('hero')}
          >
            AetherBuild
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              How It Works
            </a>
            <a 
              href="#testimonials" 
              onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Testimonials
            </a>
            <a 
              href="#faq" 
              onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              FAQ
            </a>
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
            >
              Get Started
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: isMobileMenuOpen ? 'auto' : 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4">
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
              className="block text-gray-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
              className="block text-gray-300 hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#testimonials" 
              onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}
              className="block text-gray-300 hover:text-white transition-colors"
            >
              Testimonials
            </a>
            <a 
              href="#faq" 
              onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}
              className="block text-gray-300 hover:text-white transition-colors"
            >
              FAQ
            </a>
            <motion.button
              onClick={onGetStarted}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm"
            >
              Get Started
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

// Hero Section with enhanced parallax
const HeroSection = ({ onGetStarted }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: true, amount: 0.3 });

  return (
    <section 
      id="hero" 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"
    >
      <GridBackground />
      <GradientOrb delay={0} className="top-0 left-0" intensity={1.2} />
      <GradientOrb delay={7} className="top-1/2 right-0" intensity={0.8} />
      <GradientOrb delay={14} className="bottom-0 left-1/2" intensity={1.5} />
      
      <motion.div 
        style={{ y, opacity, scale }} 
        className="relative z-10 container mx-auto px-4 py-20 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
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
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium backdrop-blur-sm">
              ✨ AI-Powered Web Builder
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Build with AI.<br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Deploy in Seconds.
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Transform your ideas into production-ready web applications. 
            <span className="text-purple-400"> Voice, images, code—everything you need in one platform.</span>
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.button
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-base sm:text-lg flex items-center gap-2 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 w-full sm:w-auto"
            >
              Get Started Free
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Enhanced scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 cursor-pointer"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        onClick={() => {
          document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-2 hover:border-purple-500 transition-colors">
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

// Component Showcase Marquee Section (like Supermemory.ai)
const ComponentShowcaseSection = () => {
  const components = [
    { icon: FiCode, name: 'TodoList', gradient: 'from-blue-500/20 to-cyan-500/20' },
    { icon: FiGlobe, name: 'WeatherCard', gradient: 'from-purple-500/20 to-pink-500/20' },
    { icon: FiLayers, name: 'NavigationMenu', gradient: 'from-indigo-500/20 to-purple-500/20' },
    { icon: FiBarChart2, name: 'DataTable', gradient: 'from-green-500/20 to-emerald-500/20' },
    { icon: FiSend, name: 'ModernNavbar', gradient: 'from-orange-500/20 to-red-500/20' },
    { icon: FiMail, name: 'ContactForm', gradient: 'from-pink-500/20 to-rose-500/20' },
    { icon: FiCpu, name: 'TicTacToe', gradient: 'from-yellow-500/20 to-amber-500/20' },
    { icon: FiZap, name: 'MemoryGame', gradient: 'from-violet-500/20 to-purple-500/20' },
  ];

  return (
    <section className="relative py-12 bg-gray-900/50 border-y border-gray-800/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 via-transparent to-gray-900/50 z-10 pointer-events-none"></div>
      <div className="relative z-0">
        <Marquee 
          items={components.map((comp, i) => (
            <ComponentCard key={i} icon={comp.icon} name={comp.name} gradient={comp.gradient} />
          ))} 
          direction="left" 
          speed={30}
        />
      </div>
    </section>
  );
};

// Feature Card Component with enhanced animations
const FeatureCard = ({ icon: Icon, title, description, delay = 0, index, gradient }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={{ y: -10, scale: 1.02 }}
      className={`group relative p-6 rounded-2xl bg-gradient-to-br ${gradient || 'from-gray-800/50 to-gray-900/50'} backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 h-full overflow-hidden`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
      
      <div className="relative z-10">
        <motion.div 
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient || 'from-purple-500 to-blue-500'} flex items-center justify-center mb-4 shadow-lg`}
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-7 h-7 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

// Features Section with updated features
const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]);

  const features = [
    {
      icon: FiCode,
      title: 'AI Code Generation',
      description: 'Describe your vision in plain English. Our advanced AI generates production-ready React code with Tailwind CSS instantly.',
      gradient: 'from-purple-500/20 to-blue-500/20',
    },
    {
      icon: FiMic,
      title: 'Voice to Code',
      description: 'Speak your requirements aloud. Our voice recognition converts your speech directly into working code—hands-free development.',
      gradient: 'from-pink-500/20 to-purple-500/20',
    },
    {
      icon: FiImage,
      title: 'Image to Code',
      description: 'Upload a screenshot or design mockup. Our AI analyzes the image and generates the corresponding React components automatically.',
      gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      icon: FiBarChart2,
      title: 'Performance Analytics',
      description: 'Get real-time insights into your code quality, complexity, and performance. AI-powered suggestions help optimize your applications.',
      gradient: 'from-orange-500/20 to-red-500/20',
    },
    {
      icon: FiPackage,
      title: 'Component Marketplace',
      description: 'Browse and integrate pre-built components from our marketplace. Drag, merge, or customize—accelerate development with ready-made solutions.',
      gradient: 'from-indigo-500/20 to-purple-500/20',
    },
    {
      icon: FiMessageCircle,
      title: 'AI Project Mentor',
      description: 'Your personal AI mentor for every project. Get code explanations, best practices, and project-specific guidance tailored to your work.',
      gradient: 'from-green-500/20 to-emerald-500/20',
    },
    {
      icon: FiZap,
      title: 'Real-Time Preview',
      description: 'See your changes live as you build. Edit code and watch your app update instantly with responsive device previews.',
      gradient: 'from-yellow-500/20 to-amber-500/20',
    },
    {
      icon: FiGlobe,
      title: 'One-Click Deploy',
      description: 'Deploy your projects to Netlify with a single click. Get a live URL instantly and share your creation with the world.',
      gradient: 'from-cyan-500/20 to-blue-500/20',
    },
    {
      icon: FiLayers,
      title: 'Full Project Management',
      description: 'Organize your projects, track conversations, manage files, and maintain version history—all in one powerful workspace.',
      gradient: 'from-violet-500/20 to-purple-500/20',
    },
  ];

  return (
    <section 
      id="features" 
      ref={ref}
      className="relative py-20 sm:py-32 bg-gray-950 overflow-hidden"
    >
      <motion.div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.05),transparent_50%)]"
        style={{ opacity }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Everything You Need to Build
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Powerful AI-powered features designed to make web development effortless and enjoyable.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
              index={index}
              gradient={feature.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works Section with enhanced animations
const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const steps = [
    {
      number: '01',
      title: 'Describe Your Vision',
      description: 'Simply tell our AI what you want to build. Use natural language, voice commands, or upload an image—no coding knowledge required.',
      icon: FiCode,
    },
    {
      number: '02',
      title: 'AI Generates Code',
      description: 'Our advanced AI analyzes your request and generates production-ready React code instantly. Choose from multiple AI models for best results.',
      icon: FiZap,
    },
    {
      number: '03',
      title: 'Preview & Edit',
      description: 'See your app come to life in real-time. Test across devices, make changes, iterate, and perfect your design with live preview.',
      icon: FiGlobe,
    },
    {
      number: '04',
      title: 'Deploy Instantly',
      description: 'One click to deploy. Get a live URL instantly and share your creation with the world. No configuration, no setup—just deploy.',
      icon: FiSend,
    },
  ];

  return (
    <section 
      id="how-it-works" 
      ref={ref}
      className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-950 to-gray-900 overflow-hidden"
    >
      <GridBackground />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Building amazing websites has never been easier. Follow these simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => {
            const stepRef = useRef(null);
            const stepInView = useInView(stepRef, { once: true, amount: 0.3 });
            
            return (
              <motion.div
                key={index}
                ref={stepRef}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={stepInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
                whileHover={{ y: -10 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8 h-full hover:border-purple-500/50 transition-all duration-300">
                  <motion.div 
                    className="text-6xl font-bold text-purple-500/20 mb-4"
                    animate={stepInView ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
                  >
                    {step.number}
                  </motion.div>
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <step.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <motion.div 
                    className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={stepInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: index * 0.15 + 0.5 }}
                  >
                    <FiArrowRight className="w-6 h-6 text-purple-500/50" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Frontend Developer',
      content: 'AetherBuild has completely transformed how I prototype. What used to take days now takes minutes. The voice-to-code feature is a game-changer!',
      avatar: 'SC',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Product Designer',
      content: 'The AI understands context so well. It\'s like having a senior developer pair programming with you. The component marketplace saves me hours.',
      avatar: 'MR',
    },
    {
      name: 'Emily Johnson',
      role: 'Startup Founder',
      content: 'We built our MVP in a weekend. This tool is a game-changer for non-technical founders. The AI mentor helped me understand every step.',
      avatar: 'EJ',
    },
  ];

  return (
    <section 
      id="testimonials" 
      ref={ref}
      className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-900 to-gray-950 overflow-hidden"
    >
      <GridBackground />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Loved by Developers
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            See what our community is saying about AetherBuild.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => {
            const testimonialRef = useRef(null);
            const testimonialInView = useInView(testimonialRef, { once: true, amount: 0.3 });
            
            return (
              <motion.div
                key={index}
                ref={testimonialRef}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={testimonialInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={testimonialInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: index * 0.15 + i * 0.1 }}
                    >
                      <FiStar className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 text-sm sm:text-base leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const faqs = [
    {
      question: 'Do I need coding experience to use AetherBuild?',
      answer: 'Not at all! AetherBuild is designed for everyone. Just describe what you want to build in plain English, use voice commands, or upload an image. Our AI will generate the code for you.',
    },
    {
      question: 'What technologies does AetherBuild support?',
      answer: 'AetherBuild generates React applications with Tailwind CSS. You can build full-stack web applications, landing pages, dashboards, and more. All code is production-ready.',
    },
    {
      question: 'Can I use voice commands to build?',
      answer: 'Yes! Our Voice to Code feature lets you speak your requirements and converts them directly into working code. Perfect for hands-free development.',
    },
    {
      question: 'How does the Component Marketplace work?',
      answer: 'Browse pre-built components like navigation bars, forms, and games. Merge them with your existing code or use them standalone. All components are production-ready.',
    },
    {
      question: 'Can I export my code?',
      answer: 'Yes! You can download your code at any time. All your projects are stored securely and can be exported as a complete React application ready for deployment.',
    },
    {
      question: 'How does deployment work?',
      answer: 'With one click, we deploy your project to Netlify. You\'ll get a live URL instantly that you can share with anyone. No configuration needed.',
    },
    {
      question: 'Is my code private?',
      answer: 'Absolutely. All your projects are private to your account. We never share your code or ideas with anyone.',
    },
    {
      question: 'What is the AI Mentor feature?',
      answer: 'The AI Mentor is your personal coding assistant for each project. It explains your code, suggests improvements, and answers project-specific questions.',
    },
  ];

  return (
    <section 
      id="faq" 
      ref={ref}
      className="relative py-20 sm:py-32 bg-gray-950 overflow-hidden"
    >
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about AetherBuild.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const faqRef = useRef(null);
            const faqInView = useInView(faqRef, { once: true, amount: 0.3 });
            
            return (
              <motion.div
                key={index}
                ref={faqRef}
                initial={{ opacity: 0, x: -50 }}
                animate={faqInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="text-white font-semibold text-sm sm:text-base pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openIndex === index ? 'auto' : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-400 text-sm sm:text-base leading-relaxed">{faq.answer}</div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = ({ onGetStarted }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <footer 
      ref={ref}
      className="relative bg-gray-950 border-t border-gray-800 overflow-hidden"
    >
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-8"
        >
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              AetherBuild
            </h3>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Build stunning websites with AI. No code required. Just describe your vision and watch it come to life.
            </p>
            <div className="flex gap-4">
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <FiGithub className="w-5 h-5 text-gray-400" />
              </motion.a>
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <FiTwitter className="w-5 h-5 text-gray-400" />
              </motion.a>
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <FiLinkedin className="w-5 h-5 text-gray-400" />
              </motion.a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-400 hover:text-purple-400 transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-gray-400 hover:text-purple-400 transition-colors">How It Works</a></li>
              <li><a href="#testimonials" className="text-gray-400 hover:text-purple-400 transition-colors">Testimonials</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-purple-400 transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Contact</a></li>
            </ul>
          </div>
        </motion.div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">© 2024 AetherBuild. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// CTA Section with enhanced animations
const CTASection = ({ onGetStarted }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 1, 0.5]);

  return (
    <section 
      ref={ref}
      className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-950 to-gray-900 overflow-hidden"
    >
      <motion.div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"
        style={{ opacity }}
      />
      <GradientOrb delay={0} className="top-0 left-1/4" intensity={1.5} />
      <GradientOrb delay={7} className="bottom-0 right-1/4" intensity={1.2} />
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
          style={{ y }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 leading-relaxed">
            Join thousands of developers building the future with AI.
          </p>
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 sm:px-10 py-4 sm:py-5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg sm:text-xl flex items-center gap-3 mx-auto shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300"
          >
            Start Building Now
            <FiArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// Main Landing Page Component
const LandingPage = ({ onGetStarted }) => {
  useEffect(() => {
    // Smooth scroll polyfill for better browser support
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <Navigation onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <ComponentShowcaseSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection onGetStarted={onGetStarted} />
      <Footer onGetStarted={onGetStarted} />
    </div>
  );
};

export default LandingPage;

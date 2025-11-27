import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { FiArrowRight, FiCode, FiZap, FiGlobe, FiShield, FiLayers, FiStar, FiCheck, FiChevronDown, FiGithub, FiTwitter, FiLinkedin, FiMail, FiUsers, FiTrendingUp, FiAward } from 'react-icons/fi';

// Aceternity UI Grid Background Component
const GridBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
    </div>
  );
};

// Animated gradient orb
const GradientOrb = ({ delay = 0, className = "" }) => {
  return (
    <motion.div
      className={`absolute w-96 h-96 rounded-full blur-3xl opacity-20 ${className}`}
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

// Animated Text Effect
const AnimatedText = ({ children, className = "" }) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.span>
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
      className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
      <div className="relative">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <GridBackground />
      <GradientOrb delay={0} className="top-0 left-0" />
      <GradientOrb delay={7} className="top-1/2 right-0" />
      <GradientOrb delay={14} className="bottom-0 left-1/2" />
      
      <motion.div style={{ y, opacity }} className="relative z-10 container mx-auto px-4 py-20 text-center">
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
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight">
            AetherBuild
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            Build stunning websites with AI. Describe your vision, and watch it come to life in seconds.
            <br />
            <span className="text-purple-400">No code. No limits. Just pure creativity.</span>
          </p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gray-800/50 border border-gray-700 text-white font-semibold text-base sm:text-lg hover:bg-gray-800 transition-all duration-300 w-full sm:w-auto"
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Parallax scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10"
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
  const apiBase = import.meta.env.VITE_API_URL;
console.log(apiBase);
  return (
    <section id="features" className="relative py-20 sm:py-32 bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.05),transparent_50%)]"></div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to Build
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
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

// How It Works Section
const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      title: 'Describe Your Vision',
      description: 'Simply tell our AI what you want to build. Use natural language - no coding knowledge required.',
      icon: FiCode,
    },
    {
      number: '02',
      title: 'AI Generates Code',
      description: 'Our advanced AI analyzes your request and generates production-ready React code instantly.',
      icon: FiZap,
    },
    {
      number: '03',
      title: 'Preview & Edit',
      description: 'See your app come to life in real-time. Make changes, iterate, and perfect your design.',
      icon: FiGlobe,
    },
    {
      number: '04',
      title: 'Deploy Instantly',
      description: 'One click to deploy. Get a live URL and share your creation with the world.',
      icon: FiTrendingUp,
    },
  ];

  return (
    <section id="how-it-works" className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-950 to-gray-900 overflow-hidden">
      <GridBackground />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Building amazing websites has never been easier. Follow these simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8 h-full hover:border-purple-500/50 transition-all duration-300">
                <div className="text-6xl font-bold text-purple-500/20 mb-4">{step.number}</div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <FiArrowRight className="w-6 h-6 text-purple-500/50" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Stats Section
const StatsSection = () => {
  const stats = [
    { icon: FiUsers, value: '10K+', label: 'Active Users' },
    { icon: FiCode, value: '50K+', label: 'Projects Built' },
    { icon: FiTrendingUp, value: '99.9%', label: 'Uptime' },
    { icon: FiAward, value: '4.9/5', label: 'User Rating' },
  ];

  return (
    <section className="relative py-20 sm:py-32 bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-4">
                <stat.icon className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-400 text-sm sm:text-base">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Frontend Developer',
      content: 'AetherBuild has completely transformed how I prototype. What used to take days now takes minutes.',
      avatar: 'SC',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Product Designer',
      content: 'The AI understands context so well. It\'s like having a senior developer pair programming with you.',
      avatar: 'MR',
    },
    {
      name: 'Emily Johnson',
      role: 'Startup Founder',
      content: 'We built our MVP in a weekend. This tool is a game-changer for non-technical founders.',
      avatar: 'EJ',
    },
  ];

  return (
    <section id="testimonials" className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-900 to-gray-950 overflow-hidden">
      <GridBackground />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Loved by Developers
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            See what our community is saying about AetherBuild.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 text-sm sm:text-base">"{testimonial.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    {
      question: 'Do I need coding experience to use AetherBuild?',
      answer: 'Not at all! AetherBuild is designed for everyone. Just describe what you want to build in plain English, and our AI will generate the code for you.',
    },
    {
      question: 'What technologies does AetherBuild support?',
      answer: 'AetherBuild generates React applications with Tailwind CSS. You can build full-stack web applications, landing pages, dashboards, and more.',
    },
    {
      question: 'Can I export my code?',
      answer: 'Yes! You can download your code at any time. All your projects are stored securely and can be exported as a complete React application.',
    },
    {
      question: 'How does deployment work?',
      answer: 'With one click, we deploy your project to Netlify. You\'ll get a live URL instantly that you can share with anyone.',
    },
    {
      question: 'Is my code private?',
      answer: 'Absolutely. All your projects are private to your account. We never share your code or ideas with anyone.',
    },
    {
      question: 'Can I collaborate with others?',
      answer: 'Currently, projects are individual. Team collaboration features are coming soon!',
    },
  ];

  return (
    <section id="faq" className="relative py-20 sm:py-32 bg-gray-950 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about AetherBuild.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 text-gray-400 text-sm sm:text-base">{faq.answer}</div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = ({ onGetStarted }) => {
  return (
    <footer className="relative bg-gray-950 border-t border-gray-800 overflow-hidden">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              AetherBuild
            </h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Build stunning websites with AI. No code required. Just describe your vision and watch it come to life.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                <FiGithub className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                <FiTwitter className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                <FiLinkedin className="w-5 h-5 text-gray-400" />
              </a>
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
        </div>
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

// CTA Section
const CTASection = ({ onGetStarted }) => {
  return (
    <section className="relative py-20 sm:py-32 bg-gradient-to-b from-gray-950 to-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      <GradientOrb delay={0} className="top-0 left-1/4" />
      <GradientOrb delay={7} className="bottom-0 right-1/4" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 mb-8">
            Join thousands of developers building the future with AI.
          </p>
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.05 }}
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
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection onGetStarted={onGetStarted} />
      <Footer onGetStarted={onGetStarted} />
    </div>
  );
};

export default LandingPage;

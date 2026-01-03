import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  BarChart3,
  Mail,
  Globe,
  Smartphone,
  ArrowRight,
  CheckCircle,
  Star,
  Quote,
  Zap,
  Shield,
  Target,
  TrendingUp,
  MessageSquare,
  Clock,
  Database,
  Settings,
  Plane,
  Hotel,
  MapPin,
  Phone,
  ChevronRight,
  Play,
  Award,
  Sparkles,
  Building2,
  HeartHandshake,
  Layers,
  MousePointer2,
  Menu,
  X,
  Rocket,
  Infinity,
  Gem,
  Crown,
  Briefcase,
  UserCheck,
  DollarSign,
  TrendingDown,
} from "lucide-react";
// import Logo from "../assets/Logo-sidebar.svg";
import Logo from "../assets/RATEHONKLOGO.png";
import LeadsDetailsImg from "../assets/leads-details.png";
import CalendarSidebarImg from "../assets/calendar-sidebar.png";
import ServicesListImg from "../assets/services-list.png";
import CalendarImg from "../assets/calendar.png";

export default function Portfolio() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    // Mouse tracking for interactive background
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  const features = [
    {
      icon: Users,
      title: "AI-Powered Lead Management",
      description:
        "Smart lead scoring with ML algorithms, automated follow-ups, and predictive customer insights that increase conversion by 65%.",
      image: LeadsDetailsImg,
      gradient: "from-cyan-500 via-blue-500 to-indigo-600",
      bgColor: "bg-cyan-50",
      metrics: "65% Higher Conversion",
    },
    {
      icon: Calendar,
      title: "Intelligent Calendar System",
      description:
        "AI-powered scheduling with smart conflict resolution, automated booking optimization, and real-time availability sync.",
      image: CalendarSidebarImg,
      gradient: "from-purple-500 via-violet-500 to-indigo-600",
      bgColor: "bg-purple-50",
      metrics: "80% Time Saved",
    },
    {
      icon: Building2,
      title: "Enterprise Module Suite",
      description:
        "Complete integrated business ecosystem with advanced workflow automation, custom integrations, and scalable architecture.",
      image: ServicesListImg,
      gradient: "from-emerald-500 via-teal-500 to-green-600",
      bgColor: "bg-emerald-50",
      metrics: "10+ Modules",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics Engine",
      description:
        "Advanced business intelligence with predictive analytics, automated insights, and comprehensive performance tracking.",
      image: CalendarImg,
      gradient: "from-orange-500 via-red-500 to-pink-600",
      bgColor: "bg-orange-50",
      metrics: "Real-Time Insights",
    },
  ];

  const stats = [
    { number: "500+", label: "Travel Agencies", icon: Building2, growth: "+40%" },
    { number: "50K+", label: "Bookings Processed", icon: Calendar, growth: "+120%" },
    { number: "99.9%", label: "Uptime Guarantee", icon: Shield, growth: "100%" },
    { number: "24/7", label: "Expert Support", icon: HeartHandshake, growth: "∞" },
  ];

  const services = [
    {
      icon: Plane,
      title: "Smart Flight Systems",
      description:
        "AI-powered flight booking with real-time optimization, predictive pricing, and automated inventory management.",
      features: [
        "Global airline connectivity",
        "Dynamic pricing engine",
        "Multi-city optimization",
        "Group booking intelligence",
      ],
      gradient: "from-sky-500 to-blue-600",
      popular: false,
    },
    {
      icon: Hotel,
      title: "Hotel Intelligence Hub",
      description:
        "Advanced accommodation platform with ML-powered recommendations, smart inventory, and personalized experiences.",
      features: [
        "Smart inventory system",
        "AI room matching",
        "Guest preference learning",
        "Automated special requests",
      ],
      gradient: "from-emerald-500 to-teal-600",
      popular: true,
    },
    {
      icon: MapPin,
      title: "Dynamic Package Builder",
      description:
        "Revolutionary package creation with AI-assisted itineraries, dynamic pricing optimization, and real-time availability.",
      features: [
        "AI itinerary generation",
        "Smart pricing optimization",
        "Template intelligence",
        "Multi-destination sync",
      ],
      gradient: "from-purple-500 to-indigo-600",
      popular: false,
    },
    {
      icon: Users,
      title: "Group Travel Engine",
      description:
        "Advanced group booking system with intelligent passenger management, automated group pricing, and smart coordination.",
      features: [
        "Smart group coordination",
        "Automated passenger profiles",
        "Dynamic group discounts",
        "Document management AI",
      ],
      gradient: "from-pink-500 to-rose-600",
      popular: false,
    },
    {
      icon: BarChart3,
      title: "Business Intelligence Pro",
      description:
        "Next-generation analytics with predictive insights, automated reporting, and real-time market intelligence.",
      features: [
        "Predictive revenue analytics",
        "Customer behavior AI",
        "Market trend analysis",
        "Performance optimization",
      ],
      gradient: "from-amber-500 to-orange-600",
      popular: true,
    },
    {
      icon: Settings,
      title: "Enterprise Integrations",
      description:
        "Seamless connectivity ecosystem with smart APIs, automated workflows, and intelligent system synchronization.",
      features: [
        "Smart API orchestration",
        "Automated workflow engine",
        "Intelligent sync protocols",
        "Enterprise connectors",
      ],
      gradient: "from-slate-500 to-gray-600",
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      title: "CEO & Founder",
      content:
        "RateHonk didn't just improve our operations—it completely transformed how we think about travel business. Our lead conversion increased by 65% in just 3 months, and the AI insights have revolutionized our pricing strategy.",
      rating: 5,
      avatar: "SJ",
      company: "Wanderlust Travel",
      result: "65% increase in conversions",
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      name: "Michael Chen",
      title: "Operations Director",
      content:
        "The automation capabilities are mind-blowing. What used to take our team 30 hours per week now happens automatically. Customer satisfaction scores jumped from 4.2 to 4.9, and our response time improved by 85%.",
      rating: 5,
      avatar: "MC",
      company: "Global Adventures",
      result: "30 hours saved weekly",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      name: "Emma Rodriguez",
      title: "Growth Manager",
      content:
        "The integrated email marketing and CRM created a perfect customer journey. Repeat bookings doubled, average deal size increased by 40%, and we've expanded to 3 new markets using RateHonk's insights.",
      rating: 5,
      avatar: "ER",
      company: "Adventure Escapes",
      result: "200% repeat booking growth",
      gradient: "from-purple-500 to-indigo-600",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small travel agencies",
      features: [
        "Up to 500 leads per month",
        "Basic CRM & calendar",
        "Email marketing",
        "Standard support",
        "Mobile app",
      ],
      gradient: "from-gray-500 to-slate-600",
      popular: false,
      savings: null,
    },
    {
      name: "Professional",
      price: "$79",
      period: "/month",
      description: "Ideal for growing travel businesses",
      features: [
        "Unlimited leads & customers",
        "Advanced analytics & AI",
        "Multi-user collaboration",
        "Priority support",
        "Custom integrations",
        "Advanced automation",
      ],
      gradient: "from-cyan-500 to-blue-600",
      popular: true,
      savings: "Save 40%",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large travel organizations",
      features: [
        "Everything in Professional",
        "Custom development",
        "Dedicated success manager",
        "24/7 phone support",
        "On-premise deployment",
        "SLA guarantees",
      ],
      gradient: "from-purple-500 to-indigo-600",
      popular: false,
      savings: "Best Value",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x / 10,
            top: mousePosition.y / 10,
            transition: 'all 0.3s ease-out'
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full blur-3xl animate-bounce" 
             style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-1/3 left-1/5 w-64 h-64 bg-gradient-to-r from-emerald-400/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '1s' }} />
      </div>

      {/* Enhanced Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="relative">
                <img src={Logo} alt="RateHonk" className="h-10 w-auto mr-3 drop-shadow-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse" />
              </div>
              <div>
                {/* <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  RateHonk
                </span>
                <div className="text-xs text-gray-500 font-medium tracking-wide">
                  TRAVEL TECHNOLOGY
                </div> */}
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {[
                { href: "#features", label: "Features" },
                { href: "#services", label: "Solutions" },
                { href: "#testimonials", label: "Success Stories" },
                { href: "#pricing", label: "Pricing" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-all duration-200 hover:scale-105"
                >
                  {item.label}
                </a>
              ))}
              <Link to="/login">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50">
            <div className="px-4 py-6 space-y-4">
              {[
                { href: "#features", label: "Features" },
                { href: "#services", label: "Solutions" },
                { href: "#testimonials", label: "Success Stories" },
                { href: "#pricing", label: "Pricing" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block text-gray-600 font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link to="/login">
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white mt-4">
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Revolutionary Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-emerald-500/15 via-teal-500/8 to-transparent rounded-full blur-3xl animate-bounce" style={{ animationDuration: '4s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-12 mb-20">
            <div className="space-y-8">
              <div className="animate-fade-in-up">
                <Badge
                  variant="outline"
                  className="text-cyan-700 border-cyan-300 bg-cyan-50/80 backdrop-blur-sm px-6 py-2 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                  #1 Travel CRM Platform • Trusted by 500+ Agencies
                </Badge>
              </div>

              <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-gray-900 leading-tight tracking-tight">
                  The Future of{" "}
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 animate-gradient">
                      Travel Business
                    </span>
                    <div className="absolute -bottom-4 left-0 w-full h-6 bg-gradient-to-r from-cyan-400/40 to-purple-400/40 rounded-full blur-md animate-pulse" />
                  </span>
                </h1>

                <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-medium">
                  Revolutionary AI-powered CRM that transforms travel agencies into 
                  <span className="text-cyan-600 font-semibold"> growth machines</span>. 
                  Experience the perfect blend of automation, intelligence, and simplicity.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-lg">
                  <span className="text-gray-600 font-medium">Starting at just</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-4xl font-black text-gradient bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      $29
                    </span>
                    <div className="text-lg text-gray-600">
                      <span className="font-medium">/month</span>
                      <div className="text-sm text-emerald-600 font-semibold">Save 40% annually</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                    30-day free trial
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                    No credit card required
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                    Cancel anytime
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-12 py-4 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
                >
                  <Rocket className="mr-3 h-6 w-6 group-hover:animate-bounce" />
                  Start Your Journey
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-12 py-4 text-xl font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-105 group"
                >
                  <Play className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Enhanced Stats with Growth Indicators */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-20 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-4 group hover:scale-110 transition-all duration-300">
                  <div className="flex justify-center mb-4">
                    <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <stat.icon className="w-8 h-8 text-cyan-600" />
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {stat.growth}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl lg:text-4xl font-black text-gray-900">
                      {stat.number}
                    </div>
                    <div className="text-sm lg:text-base text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced App Icons Grid with Animations */}
          <div className="max-w-6xl mx-auto animate-fade-in-up" style={{ animationDelay: '1s' }}>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 lg:gap-6">
              {[
                { icon: Users, name: "Smart CRM", color: "from-blue-500 to-cyan-500" },
                { icon: Calendar, name: "AI Calendar", color: "from-emerald-500 to-teal-500" },
                { icon: Mail, name: "Email Engine", color: "from-purple-500 to-indigo-500" },
                { icon: BarChart3, name: "Analytics Pro", color: "from-orange-500 to-red-500" },
                { icon: Globe, name: "Booking Hub", color: "from-pink-500 to-rose-500" },
                { icon: Settings, name: "Automation", color: "from-gray-500 to-slate-500" },
                { icon: Plane, name: "Travel Suite", color: "from-cyan-500 to-blue-500" },
                { icon: Hotel, name: "Hotel Engine", color: "from-green-500 to-emerald-500" },
                { icon: Database, name: "Reports AI", color: "from-violet-500 to-purple-500" },
                { icon: Shield, name: "Security", color: "from-amber-500 to-orange-500" },
                { icon: MessageSquare, name: "Support Bot", color: "from-red-500 to-pink-500" },
                { icon: Target, name: "Goals AI", color: "from-teal-500 to-cyan-500" },
                { icon: Zap, name: "Speed", color: "from-yellow-500 to-amber-500" },
                { icon: Gem, name: "Premium", color: "from-indigo-500 to-purple-500" },
              ].map((app, index) => (
                <div 
                  key={index} 
                  className="group cursor-pointer animate-float"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-lg border border-gray-100/50 group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:rotate-3">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${app.color} rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <app.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                      {app.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Features Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-white to-gray-50 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 text-base font-medium">
              <Zap className="w-5 h-5 mr-2" />
              Revolutionary Features
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight">
              Everything you need to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">
                dominate your market
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Experience the next generation of travel CRM with AI-powered automation, 
              predictive analytics, and intelligent workflows that transform your business.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-500 border-2 group ${
                    activeFeature === index
                      ? `border-cyan-500 shadow-2xl ${feature.bgColor} scale-105`
                      : "border-gray-200 hover:border-gray-300 hover:shadow-xl hover:scale-102"
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-6">
                      <div
                        className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          activeFeature === index
                            ? `bg-gradient-to-br ${feature.gradient} text-white shadow-xl scale-110`
                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                        }`}
                      >
                        <feature.icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-cyan-900 transition-colors">
                            {feature.title}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={`${activeFeature === index ? 'bg-cyan-100 text-cyan-800' : 'bg-gray-100 text-gray-600'} transition-all duration-300`}
                          >
                            {feature.metrics}
                          </Badge>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        {activeFeature === index && (
                          <div className="flex items-center text-cyan-600 font-semibold text-sm pt-3 animate-fade-in">
                            <Play className="w-5 h-5 mr-2 animate-pulse" />
                            Experience Live Demo
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative bg-white rounded-3xl shadow-3xl overflow-hidden border border-gray-100 group-hover:shadow-4xl transition-all duration-500">
                <div className="absolute top-6 left-6 flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <div className="absolute top-6 right-6">
                  <Badge
                    className={`bg-gradient-to-r ${features[activeFeature].gradient} text-white border-0 shadow-lg animate-pulse`}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Live Preview
                  </Badge>
                </div>
                <div className="pt-16">
                  <img
                    src={features[activeFeature].image}
                    alt={features[activeFeature].title}
                    className="w-full h-auto transition-all duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section id="services" className="py-24 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <Badge className="bg-white/10 text-white border-white/20 px-6 py-2 text-base font-medium backdrop-blur-sm">
              <Rocket className="w-5 h-5 mr-2" />
              Complete Solutions
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black leading-tight">
              Comprehensive Travel
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Business Ecosystem
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              From AI-powered lead capture to automated booking completion, our platform 
              revolutionizes every aspect of your travel business operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="border-0 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 group hover:scale-105 hover:-translate-y-2"
              >
                <CardContent className="p-8 relative">
                  {service.popular && (
                    <div className="absolute -top-3 -right-3">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg animate-pulse">
                        <Crown className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <service.icon className="w-8 h-8 text-white" />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                        {service.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {service.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center text-sm text-gray-300 group-hover:text-gray-200 transition-colors"
                        >
                          <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full border-white/20 text-white hover:bg-white hover:text-gray-900 transition-all duration-300 group-hover:scale-105"
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-white to-cyan-50 relative">
        <div className="absolute inset-0 bg-pattern opacity-5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 text-base font-medium">
              <Award className="w-5 h-5 mr-2" />
              Success Stories
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight">
              Trusted by travel
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                industry leaders
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              See how forward-thinking travel agencies are transforming their operations 
              and achieving unprecedented growth with RateHonk.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="p-8 relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Quote className="w-4 h-4 text-white" />
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <Badge 
                        variant="secondary"
                        className={`bg-gradient-to-r ${testimonial.gradient} text-white border-0`}
                      >
                        {testimonial.result}
                      </Badge>
                    </div>

                    <p className="text-gray-700 leading-relaxed font-medium italic">
                      "{testimonial.content}"
                    </p>

                    <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
                      <div className={`w-14 h-14 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          {testimonial.title}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                          {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-slate-50 to-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 text-base font-medium">
              <DollarSign className="w-5 h-5 mr-2" />
              Simple Pricing
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight">
              Choose your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                growth plan
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Transparent pricing with no hidden fees. Scale your business with confidence 
              using our flexible plans designed for every stage of growth.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative transition-all duration-500 hover:scale-105 ${
                  plan.popular
                    ? "border-2 border-cyan-500 shadow-2xl bg-gradient-to-br from-cyan-50 to-blue-50"
                    : "border border-gray-200 shadow-lg hover:shadow-xl bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 shadow-lg">
                      <Crown className="w-4 h-4 mr-2" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-gray-600">{plan.description}</p>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center">
                        <span className="text-5xl font-black text-gray-900">{plan.price}</span>
                        {plan.period && (
                          <span className="text-xl text-gray-600 ml-1">{plan.period}</span>
                        )}
                      </div>
                      {plan.savings && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          {plan.savings}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                        plan.popular
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                    >
                      {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-12">
            <div className="space-y-8">
              <Badge className="bg-white/10 text-white border-white/20 px-6 py-3 text-lg font-medium backdrop-blur-sm">
                <Infinity className="w-6 h-6 mr-2" />
                Unlimited Potential Awaits
              </Badge>

              <h2 className="text-5xl lg:text-7xl font-black leading-tight">
                Ready to transform your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  travel business?
                </span>
              </h2>

              <p className="text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed">
                Join the revolution of intelligent travel management. Experience the power 
                of AI-driven automation, predictive analytics, and seamless operations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-16 py-6 text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
                >
                  <Rocket className="mr-4 h-8 w-8 group-hover:animate-bounce" />
                  Start Your Transformation
                  <ArrowRight className="ml-4 h-8 w-8 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-16 py-6 text-2xl font-bold transition-all duration-300 hover:scale-105 group backdrop-blur-sm"
                >
                  <Play className="mr-4 h-8 w-8 group-hover:scale-110 transition-transform" />
                  See It In Action
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 max-w-4xl mx-auto">
              <div className="text-center space-y-2">
                <div className="text-3xl font-black text-cyan-400">30 Days</div>
                <div className="text-gray-400">Free Trial</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-black text-purple-400">No Risk</div>
                <div className="text-gray-400">Cancel Anytime</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-black text-emerald-400">24/7</div>
                <div className="text-gray-400">Expert Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .bg-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}
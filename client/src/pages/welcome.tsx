import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, CheckCircle, Gift, Star, Zap } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { RateHonkLogo } from "@/components/ui/ratehonk-logo";
import Logo from "../assets/Logo-sidebar.svg"

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [showCrackers, setShowCrackers] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // Animation sequence
    const timers = [
      setTimeout(() => setAnimationStep(1), 500),
      setTimeout(() => setAnimationStep(2), 1000),
      setTimeout(() => setAnimationStep(3), 1500),
      setTimeout(() => setShowCrackers(false), 3000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleContinue = () => {
    // Mark first login as complete
    localStorage.setItem('first_login', 'false');
    setLocation("/modules");
  };

  // Cracker Animation Component
  const CrackerAnimation = () => (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Confetti/Crackers particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`absolute animate-bounce`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          {i % 4 === 0 && <Sparkles className="w-6 h-6 text-yellow-400" />}
          {i % 4 === 1 && <Star className="w-5 h-5 text-pink-400" />}
          {i % 4 === 2 && <Gift className="w-5 h-5 text-blue-400" />}
          {i % 4 === 3 && <Zap className="w-4 h-4 text-purple-400" />}
        </div>
      ))}
      
      {/* Larger celebration elements */}
      <div className="absolute top-1/4 left-1/4 animate-pulse">
        <Sparkles className="w-12 h-12 text-yellow-500" />
      </div>
      <div className="absolute top-1/3 right-1/4 animate-pulse" style={{ animationDelay: '0.5s' }}>
        <Star className="w-10 h-10 text-pink-500" />
      </div>
      <div className="absolute bottom-1/3 left-1/3 animate-pulse" style={{ animationDelay: '1s' }}>
        <Gift className="w-10 h-10 text-blue-500" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-200/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-pink-200/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Cracker animation overlay */}
      {showCrackers && <CrackerAnimation />}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-4xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            {/* Main welcome content */}
            <div className={`transition-all duration-1000 ${animationStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="mb-8">
                <div className="mb-6">
                  {/* <RateHonkLogo height="100px" /> */}
                     <img
                  src={Logo}
                  alt="Logo"
                  className="w-[180px] h-[60px] object-contain center mx-auto rounded-md bg-white p-2"
                />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Welcome to Your Business Platform!
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Congratulations, <span className="font-semibold text-cyan-600">{user?.firstName}</span>! 
                  Your account has been successfully created and your free trial has started.
                </p>
              </div>
            </div>

            {/* Feature highlights */}
            <div className={`transition-all duration-1000 delay-500 ${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">14-Day Free Trial</h3>
                  <p className="text-sm text-gray-600">Full access to all premium features</p>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Zap className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Multi-Domain Platform</h3>
                  <p className="text-sm text-gray-600">CRM & ERP for every business type</p>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                  <Star className="w-8 h-8 text-pink-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Expert Support</h3>
                  <p className="text-sm text-gray-600">24/7 help when you need it</p>
                </div>
              </div>
            </div>

            {/* Call to action */}
            <div className={`transition-all duration-1000 delay-1000 ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white mb-8">
                  <h3 className="text-lg font-semibold mb-2">🎉 Special Welcome Bonus!</h3>
                  <p className="text-purple-100">
                    As a new user, you'll get guided tours, pre-built templates, and priority onboarding support
                  </p>
                </div>

                <Button 
                  onClick={handleContinue}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Let's Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <p className="text-sm text-gray-500 mt-4">
                  Takes less than 2 minutes to set up your first module
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
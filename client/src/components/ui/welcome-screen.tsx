import React, { useEffect, useState } from 'react';
import { RateHonkLogo } from '@/components/ui/ratehonk-logo';

import confetti from 'canvas-confetti';
// import Logo from "../../assets/Logo-sidebar.svg"
import Logo from "../../assets/RATEHONKLOGO.png";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    // Start content animation after a brief delay
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    // Start fireworks after content appears
    const fireworksTimer = setTimeout(() => {
      setShowFireworks(true);
      triggerFireworks();
    }, 800);

    // Complete the welcome screen after showing it
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(fireworksTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const triggerFireworks = () => {
    const duration = 3500;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from left side
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2
        },
        colors: ['#0BBCD6', '#00A6B8', '#007A8A', '#FFD700', '#FFA500', '#FF6B6B']
      });

      // Fire from right side
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2
        },
        colors: ['#0BBCD6', '#00A6B8', '#007A8A', '#FFD700', '#FFA500', '#FF6B6B']
      });
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-700">
      <div 
        className={`text-center text-white transform transition-all duration-1000 ${
          showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        <div className="mb-8 flex justify-center">
          <div className="w-56 h-24 flex items-center justify-center">
            {/* <RateHonkLogo 
              className="text-white transform transition-all duration-1000" 
              height="100px" 
            /> */}
             <img
                  src={Logo}
                  alt="Logo"
                  className="w-[180px] h-[60px] object-contain center mx-auto rounded-md bg-white p-2"
                />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-pulse">
            Welcome Back!
          </h1>
          <p className="text-xl md:text-2xl text-cyan-100 mb-8">
            Let's get you started with your business management platform
          </p>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-300/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      <div className="absolute top-1/2 left-10 w-20 h-20 bg-white/5 rounded-full blur-lg animate-bounce"></div>
      <div className="absolute top-1/3 right-32 w-24 h-24 bg-cyan-200/10 rounded-full blur-xl animate-pulse delay-1000"></div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Star, Sparkles, Trophy, Zap, Heart, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  platform: string;
  stats?: {
    pagesConnected?: number;
    leadsAvailable?: number;
    instagramConnected?: boolean;
  };
}

// Confetti particle component
const ConfettiParticle = ({ delay = 0 }: { delay?: number }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: randomColor }}
      initial={{ 
        x: Math.random() * 400 - 200,
        y: -20,
        rotate: 0,
        scale: 0
      }}
      animate={{
        y: 600,
        rotate: 360,
        scale: [0, 1, 0.8, 0]
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay: delay,
        ease: "easeOut"
      }}
    />
  );
};

// Success icons animation
const SuccessIcon = ({ icon: Icon, delay = 0 }: { icon: any; delay?: number }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ 
      delay, 
      type: "spring", 
      stiffness: 200, 
      damping: 15 
    }}
    className="text-green-500"
  >
    <Icon className="h-6 w-6" />
  </motion.div>
);

// Platform specific celebration messages
const getCelebrationData = (platform: string) => {
  const celebrations = {
    facebook: {
      title: "🎉 Facebook Business Suite Connected!",
      subtitle: "Your social media powerhouse is ready!",
      color: "from-blue-500 to-blue-600",
      icon: "📘",
      benefits: [
        "Import leads from Facebook ads",
        "Manage Instagram Business account", 
        "Schedule posts across platforms",
        "Access comprehensive insights"
      ]
    },
    instagram: {
      title: "📸 Instagram Business Connected!",
      subtitle: "Visual storytelling just got easier!",
      color: "from-pink-500 to-purple-600",
      icon: "📷",
      benefits: [
        "Sync Instagram leads",
        "Schedule visual content",
        "Track engagement metrics",
        "Manage business profile"
      ]
    },
    linkedin: {
      title: "💼 LinkedIn Ads Connected!",
      subtitle: "Professional networking activated!",
      color: "from-blue-600 to-blue-700",
      icon: "💼",
      benefits: [
        "Import B2B leads",
        "Professional targeting",
        "Company page management",
        "Advanced analytics"
      ]
    }
  };
  
  return celebrations[platform as keyof typeof celebrations] || celebrations.facebook;
};

export function Celebration({ isVisible, onClose, platform, stats }: CelebrationProps) {
  const [showStats, setShowStats] = useState(false);
  const [confettiCount, setConfettiCount] = useState(0);
  const celebrationData = getCelebrationData(platform);

  useEffect(() => {
    if (isVisible) {
      // Show stats after main animation
      const timer = setTimeout(() => setShowStats(true), 1500);
      
      // Generate confetti particles
      const confettiTimer = setInterval(() => {
        setConfettiCount(prev => prev + 1);
      }, 100);
      
      // Stop confetti after 3 seconds
      const stopConfetti = setTimeout(() => {
        clearInterval(confettiTimer);
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(confettiTimer);
        clearTimeout(stopConfetti);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setShowStats(false);
      setConfettiCount(0);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Confetti particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: confettiCount }).map((_, i) => (
                <ConfettiParticle key={i} delay={i * 0.1} />
              ))}
            </div>

            {/* Main celebration card */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full"
            >
              <Card className="overflow-hidden border-0 shadow-2xl">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${celebrationData.color} p-8 text-white text-center relative overflow-hidden`}>
                  {/* Floating icons */}
                  <div className="absolute inset-0">
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        x: [0, 5, 0],
                        rotate: [0, 5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute top-4 left-4 text-2xl opacity-30"
                    >
                      ✨
                    </motion.div>
                    <motion.div
                      animate={{
                        y: [0, -15, 0],
                        x: [0, -5, 0],
                        rotate: [0, -5, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                      }}
                      className="absolute top-4 right-4 text-2xl opacity-30"
                    >
                      🎊
                    </motion.div>
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xl opacity-40"
                    >
                      🚀
                    </motion.div>
                  </div>

                  {/* Main content */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative z-10"
                  >
                    <div className="text-4xl mb-2">{celebrationData.icon}</div>
                    <h2 className="text-2xl font-bold mb-2">{celebrationData.title}</h2>
                    <p className="text-blue-100 text-lg">{celebrationData.subtitle}</p>
                  </motion.div>

                  {/* Success icons row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex justify-center space-x-4 mt-6"
                  >
                    <SuccessIcon icon={CheckCircle} delay={0.8} />
                    <SuccessIcon icon={Zap} delay={1.0} />
                    <SuccessIcon icon={Target} delay={1.2} />
                    <SuccessIcon icon={Star} delay={1.4} />
                  </motion.div>
                </div>

                <CardContent className="p-8">
                  {/* Connection stats */}
                  <AnimatePresence>
                    {showStats && stats && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                      >
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          Connection Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {stats.pagesConnected && (
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {stats.pagesConnected}
                              </div>
                              <div className="text-sm text-green-700">Pages Connected</div>
                            </div>
                          )}
                          {stats.leadsAvailable && (
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {stats.leadsAvailable}
                              </div>
                              <div className="text-sm text-blue-700">Leads Available</div>
                            </div>
                          )}
                        </div>
                        {stats.instagramConnected && (
                          <div className="mt-3 text-center">
                            <Badge className="bg-pink-100 text-pink-700">
                              <Heart className="h-3 w-3 mr-1" />
                              Instagram Business Connected
                            </Badge>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Benefits list */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="mb-6"
                  >
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      What You Can Do Now
                    </h3>
                    <ul className="space-y-2">
                      {celebrationData.benefits.map((benefit, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.8 + index * 0.1 }}
                          className="flex items-center gap-3 text-gray-700"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {benefit}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Action buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2 }}
                    className="flex gap-3"
                  >
                    <Button 
                      onClick={onClose}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Start Using Features
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={onClose}
                      className="px-6"
                    >
                      Got It
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Quick celebration toast for smaller interactions
export function QuickCelebration({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="flex items-center gap-3 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg"
    >
      <motion.div
        initial={{ rotate: -180 }}
        animate={{ rotate: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {icon || <CheckCircle className="h-5 w-5" />}
      </motion.div>
      <span className="font-medium">{message}</span>
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        ✨
      </motion.div>
    </motion.div>
  );
}
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Star, 
  Users, 
  Calendar, 
  Mail, 
  BarChart,
  Settings,
  CheckCircle 
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Travel CRM!',
    description: 'Let\'s take a quick tour of your new dashboard. This will only take 2 minutes.',
    target: 'dashboard-header',
    icon: <Star className="w-5 h-5" />,
    position: 'bottom'
  },
  {
    id: 'navigation',
    title: 'Sidebar Navigation',
    description: 'Access all your CRM features from this sidebar. You can customize the menu order and visibility.',
    target: 'sidebar',
    icon: <Settings className="w-5 h-5" />,
    position: 'right'
  },
  {
    id: 'customers',
    title: 'Customer Management',
    description: 'Manage your customers, view their booking history, and track their preferences.',
    target: 'nav-customers',
    icon: <Users className="w-5 h-5" />,
    position: 'right'
  },
  {
    id: 'calendar',
    title: 'Calendar & Bookings',
    description: 'View all your bookings, appointments, and important dates in one place.',
    target: 'nav-calendar',
    icon: <Calendar className="w-5 h-5" />,
    position: 'right'
  },
  {
    id: 'gmail',
    title: 'Gmail Integration',
    description: 'Connect your Gmail account to manage emails directly within the CRM.',
    target: 'nav-gmail',
    icon: <Mail className="w-5 h-5" />,
    position: 'right'
  },
  {
    id: 'reports',
    title: 'Analytics & Reports',
    description: 'Track your business performance with detailed analytics and custom reports.',
    target: 'nav-reports',
    icon: <BarChart className="w-5 h-5" />,
    position: 'right'
  }
];

interface DashboardTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function DashboardTour({ isVisible, onComplete, onSkip }: DashboardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tourPosition, setTourPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible && currentStep < tourSteps.length) {
      const targetElement = document.getElementById(tourSteps[currentStep].target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const step = tourSteps[currentStep];
        
        let top = 0;
        let left = 0;
        
        switch (step.position) {
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2 - 200; // Center the tour card
            break;
          case 'right':
            top = rect.top + rect.height / 2 - 100;
            left = rect.right + 20;
            break;
          case 'top':
            top = rect.top - 220;
            left = rect.left + rect.width / 2 - 200;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - 100;
            left = rect.left - 420;
            break;
        }
        
        // Ensure tour card stays within viewport
        top = Math.max(20, Math.min(top, window.innerHeight - 240));
        left = Math.max(20, Math.min(left, window.innerWidth - 420));
        
        setTourPosition({ top, left });
        
        // Highlight the target element
        targetElement.style.outline = '3px solid #8b5cf6';
        targetElement.style.outlineOffset = '2px';
        targetElement.style.borderRadius = '8px';
        targetElement.style.zIndex = '999';
        
        // Clean up previous highlights
        return () => {
          targetElement.style.outline = '';
          targetElement.style.outlineOffset = '';
          targetElement.style.borderRadius = '';
          targetElement.style.zIndex = '';
        };
      }
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Clean up any highlights
    tourSteps.forEach(step => {
      const element = document.getElementById(step.target);
      if (element) {
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.borderRadius = '';
        element.style.zIndex = '';
      }
    });
    onComplete();
  };

  const handleSkip = () => {
    // Clean up any highlights
    tourSteps.forEach(step => {
      const element = document.getElementById(step.target);
      if (element) {
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.borderRadius = '';
        element.style.zIndex = '';
      }
    });
    onSkip();
  };

  if (!isVisible || currentStep >= tourSteps.length) {
    return null;
  }

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[998]" />
      
      {/* Tour Card */}
      <Card 
        className="fixed z-[999] w-96 shadow-2xl border-purple-200 bg-white"
        style={{ top: tourPosition.top, left: tourPosition.left }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step.icon}
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            {step.description}
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {currentStep + 1} of {tourSteps.length}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip} className="text-gray-500">
                Skip Tour
              </Button>
              
              <Button onClick={handleNext} className="flex items-center gap-1">
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
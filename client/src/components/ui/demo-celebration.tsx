import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Celebration } from "@/components/ui/celebration";
import { Facebook, Instagram, Linkedin } from "lucide-react";

export function DemoCelebration() {
  const [showDemo, setShowDemo] = useState(false);
  const [demoType, setDemoType] = useState<'facebook' | 'instagram' | 'linkedin'>('facebook');

  const demoStats = {
    facebook: {
      pagesConnected: 3,
      leadsAvailable: 24,
      instagramConnected: true
    },
    instagram: {
      pagesConnected: 1,
      leadsAvailable: 12,
      instagramConnected: false
    },
    linkedin: {
      pagesConnected: 2,
      leadsAvailable: 8,
      instagramConnected: false
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Test Celebration Animation</h3>
      
      <div className="flex gap-3">
        <Button
          onClick={() => {
            setDemoType('facebook');
            setShowDemo(true);
          }}
          variant="outline"
          size="sm"
        >
          <Facebook className="h-4 w-4 mr-2" />
          Facebook Demo
        </Button>
        
        <Button
          onClick={() => {
            setDemoType('instagram');
            setShowDemo(true);
          }}
          variant="outline"
          size="sm"
        >
          <Instagram className="h-4 w-4 mr-2" />
          Instagram Demo
        </Button>
        
        <Button
          onClick={() => {
            setDemoType('linkedin');
            setShowDemo(true);
          }}
          variant="outline"
          size="sm"
        >
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn Demo
        </Button>
      </div>

      <Celebration
        isVisible={showDemo}
        onClose={() => setShowDemo(false)}
        platform={demoType}
        stats={demoStats[demoType]}
      />
    </div>
  );
}
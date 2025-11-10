import { cn } from "@/lib/utils";
import logoImage from "@assets/RatehonkCrmLogo_1754930181137.jpeg";

interface RateHonkLogoProps {
  className?: string;
  height?: string | number;
}

export function RateHonkLogo({ className, height = "120px" }: RateHonkLogoProps) {
  return (
    <div 
      className={cn("flex items-center justify-center", className)}
      style={{ height }}
    >
      <img 
        src={logoImage} 
        alt="RateHonk CRM" 
        className="h-20 w-auto object-contain md:h-20 sm:h-18"
        style={{ maxHeight: '80px' }}
      />
    </div>
  );
}

export function RateHonkLogoSmall({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <img 
        src={logoImage} 
        alt="RateHonk CRM" 
        className="h-8 w-auto object-contain"
        style={{ maxHeight: '32px' }}
      />
    </div>
  );
}
import { useState } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZoomPhoneEmbed } from "./zoom-phone-embed";

export function FloatingZoomButton() {
  const [isZoomDialogOpen, setIsZoomDialogOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsZoomDialogOpen(true)}
        className="fixed bottom-32 right-6 h-14 w-14 rounded-full shadow-lg bg-cyan-600 hover:bg-cyan-700 text-white z-50 transition-all duration-200 hover:scale-110"
        data-testid="button-floating-zoom-call"
        title="Open Zoom Phone"
      >
        <Video className="h-6 w-6" />
      </Button>

      {/* Zoom Phone Dialog */}
      <ZoomPhoneEmbed
        isOpen={isZoomDialogOpen}
        onClose={() => setIsZoomDialogOpen(false)}
      />
    </>
  );
}

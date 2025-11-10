import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { ExternalLink, RefreshCw, AlertCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";

const TravelSearchB2C = () => {
  const { tenant } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  // Fetch booking URL from backend (securely includes WhatsApp API key and default device)
  const { data: bookingData, isError: bookingUrlError, isLoading: bookingUrlLoading } = useQuery({
    queryKey: ["/api/whatsapp/booking-url"],
    enabled: !!tenant?.id,
  });

  // Use the secure booking URL from backend (NEVER expose API key in frontend!)
  const bookingUrl = (bookingData as any)?.url;

  console.log("Booking URL:", bookingUrl);
  console.log("WhatsApp config included:", (bookingData as any)?.hasWhatsAppConfig);
  console.log("Default device included:", (bookingData as any)?.hasDefaultDevice);
  const handleIframeLoad = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const refreshPage = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsLoading(true);
    setHasError(false);

    // Set timeout fallback for iframe loading
    const newTimeoutId = setTimeout(() => {
      setIsLoading(false);
      setHasError(true);
    }, 8000); // 8 second timeout
    setTimeoutId(newTimeoutId);

    // Force iframe reload by changing its src
    const iframe = document.getElementById(
      "ratehonk-booking-iframe",
    ) as HTMLIFrameElement;
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = "";
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 100);
    }
  };

  const openInNewTab = () => {
    if (bookingUrl) {
      window.open(bookingUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Layout>
      <div className="h-screen flex flex-col">
        {/* Page Header */}
        <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Travel Search
              </h1>
              <p className="text-sm text-gray-500">
                RateHonk travel booking platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPage}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </header>

        {/* Backend URL Loading Error */}
        {bookingUrlError && (
          <div className="flex items-center justify-center py-12 bg-gray-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">
                  Failed to Load Booking URL
                </CardTitle>
                <CardDescription>
                  Unable to fetch the secure booking URL from the server. Please try refreshing or contact support if the issue persists.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This may be due to a server connectivity issue. The booking URL includes secure WhatsApp integration credentials that must be loaded from the server.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => window.location.reload()} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {!bookingUrlError && (bookingUrlLoading || isLoading) && (
          <div className="flex items-center justify-center py-12 bg-gray-50">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Loading RateHonk Travel Platform
              </p>
              <p className="text-sm text-gray-500">
                Please wait while we load the travel booking interface...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!bookingUrlError && hasError && (
          <div className="flex items-center justify-center py-12 bg-gray-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">
                  Unable to Load Travel Platform
                </CardTitle>
                <CardDescription>
                  The RateHonk travel platform could not be loaded. This might
                  be due to network issues or the external site blocking iframe
                  access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some websites prevent embedding in iframes for security
                    reasons. You can still access the platform by opening it in
                    a new tab.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button onClick={refreshPage} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={openInNewTab}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Direct
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content - Iframe */}
        {!bookingUrlError && bookingUrl && (
          <div
            className="flex-1 relative bg-white"
            style={{ display: hasError ? "none" : "block" }}
          >
            <iframe
              id="ratehonk-booking-iframe"
              src={bookingUrl}
              className="w-full h-full border-0"
              title="RateHonk Travel Search"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              ref={(iframe) => {
                if (iframe && isLoading && !timeoutId) {
                  // Set initial timeout when iframe is mounted
                  const newTimeoutId = setTimeout(() => {
                    setIsLoading(false);
                    setHasError(true);
                  }, 8000);
                  setTimeoutId(newTimeoutId);
                }
              }}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                overflow: "hidden",
              }}
              data-testid="iframe-ratehonk-booking"
            />
          </div>
        )}

        {/* Info Footer */}
        {!isLoading && !hasError && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <Globe className="h-4 w-4" />
                <span>Embedded: RateHonk Travel Platform</span>
              </div>
              <div className="text-blue-600">Powered by RateHonk</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TravelSearchB2C;

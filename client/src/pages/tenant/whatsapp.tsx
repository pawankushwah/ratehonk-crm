import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import {
  ExternalLink,
  RefreshCw,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
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
import { useLocation } from "wouter";

const WhatsApp = () => {
  const { tenant } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Legacy URL for whatsappbusiness.ratehonk.com (when provider not configured)
  const legacyWhatsappUrl = `https://whatsappbusiness.ratehonk.com/en/home?email=${encodeURIComponent(tenant?.contactEmail || "")}&phone=${encodeURIComponent(tenant?.contactPhone || "")}&tenantId=${tenant?.id || ""}`;

  // Fetch iframe URL from API - uses crm-login (provider) or live chat URL
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch("/api/whatsapp/check-integration", { headers, credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.hasIntegration) {
          setIsRedirecting(true);
          setLocation("/whatsapp-setup");
          return;
        }
        if (data.panelUrl) {
          setIframeUrl(data.panelUrl);
          return;
        }
        if (data.hasDefaultDevice && data.apiKey && data.defaultDevice) {
          const liveUrl = `https://whatsappbusiness.ratehonk.com/en/auto-login?api_key=${data.apiKey}&redirect_url=chat&device_number=${data.defaultDevice.number}`;
          setIframeUrl(liveUrl);
          return;
        }
        setIsRedirecting(true);
        setLocation("/whatsapp-devices");
      })
      .catch(() => {
        if (!cancelled) setIframeUrl(legacyWhatsappUrl);
      });
    return () => { cancelled = true; };
  }, [setLocation]);

  const whatsappUrl = iframeUrl || legacyWhatsappUrl;

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
      "ratehonk-whatsapp-iframe",
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
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <div className="h-screen flex flex-col">
        {/* Page Header */}
        <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">WhatsApp</h1>
              <p className="text-sm text-gray-500">
                RateHonk WhatsApp messaging platform
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 bg-gray-50">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <RefreshCw className="h-6 w-6 text-green-600 animate-spin" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Loading RateHonk WhatsApp Platform
              </p>
              <p className="text-sm text-gray-500">
                Please wait while we load the WhatsApp messaging interface...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="flex items-center justify-center py-12 bg-gray-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">
                  Unable to Load WhatsApp Platform
                </CardTitle>
                <CardDescription>
                  The RateHonk WhatsApp platform could not be loaded. This might
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
        <div
          className="flex-1 relative bg-white"
          style={{ display: hasError || isRedirecting || !iframeUrl ? "none" : "block" }}
        >
          <iframe
            id="ratehonk-whatsapp-iframe"
            src={whatsappUrl}
            className="w-full h-full border-0"
            title="RateHonk WhatsApp"
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
            data-testid="iframe-ratehonk-whatsapp"
          />
        </div>

        {/* Info Footer */}
        {!isLoading && !hasError && (
          <div className="px-4 py-2 bg-green-50 border-t border-green-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <MessageSquare className="h-4 w-4" />
                <span>Embedded: RateHonk WhatsApp Platform</span>
              </div>
              <div className="text-green-600">Powered by RateHonk</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WhatsApp;

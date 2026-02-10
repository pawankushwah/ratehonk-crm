import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Palette,
  Link2,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";

const CANVA_DEVELOPER_URL = "https://www.canva.com/developers/";
const CANVA_OAUTH_DOCS = "https://www.canva.com/developers/apps/oauth/";

export default function CanvaSetup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleBack = () => {
    setLocation("/shortcuts");
  };

  const handleConnectCanva = async () => {
    setIsConnecting(true);
    try {
      // Placeholder: open Canva developer portal for now; replace with OAuth when backend is ready
      window.open(CANVA_DEVELOPER_URL, "_blank", "noopener,noreferrer");
      toast({
        title: "Canva integration",
        description:
          "To connect Canva, you'll need to create an app at the Canva Developer Portal. Full OAuth connection coming soon.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not open Canva",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg shadow-sm border border-gray-200 hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{
                  background: "linear-gradient(135deg, #00C4CC 0%, #7B2FDE 100%)",
                }}
              >
                C
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Canva integration
                </h1>
                <p className="text-gray-600">
                  Connect Canva to use templates and designs in your CRM
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Setup
                </CardTitle>
                <CardDescription>
                  Link your Canva account to access brand kits, templates, and
                  design assets from campaigns, emails, and marketing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleConnectCanva}
                    disabled={isConnecting}
                    className="bg-[#00C4CC] hover:bg-[#00a8af] text-white"
                  >
                    {isConnecting ? (
                      "Connecting…"
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Connect to Canva
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                  >
                    <a
                      href={CANVA_OAUTH_DOCS}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      OAuth docs
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  You will be taken to the Canva Developer Portal to create an app
                  and get API credentials. Once backend OAuth is configured, this
                  button will connect your account directly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  What you can do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Use Canva templates in email campaigns and social posts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Sync brand colors and logos from your Canva Brand Kit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Export designs and attach them to leads or customers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Keep marketing assets consistent across the CRM
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="shrink-0">
                    Note
                  </Badge>
                  <p className="text-sm text-amber-900/90">
                    Canva Connect and API access require a Canva account and an
                    app created in the{" "}
                    <a
                      href={CANVA_DEVELOPER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium hover:no-underline"
                    >
                      Canva Developer Portal
                    </a>
                    . Contact your administrator if you need help with OAuth
                    setup.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

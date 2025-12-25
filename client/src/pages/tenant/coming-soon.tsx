import { Layout } from "@/components/layout/layout";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ComingSoon() {
  const [location, setLocation] = useLocation();
  
  // Extract platform name from URL or query params
  const platformName = location.includes('linkedin') ? 'LinkedIn' :
                      location.includes('twitter') ? 'Twitter' :
                      location.includes('tiktok') ? 'TikTok' : 'This Integration';

  const handleBack = () => {
    setLocation("/shortcuts");
  };

  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Header with back button */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg shadow-sm border border-gray-200 hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>

          {/* Coming Soon Content */}
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <Construction className="h-10 w-10 text-yellow-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Coming Soon
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">
                    {platformName} Integration
                  </p>
                  <p className="text-sm text-gray-500">
                    We're working hard to bring you {platformName} integration. 
                    This feature will be available soon!
                  </p>
                </div>
                
                <div className="mt-6">
                  <Link href="/shortcuts">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Back to Shortcuts
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}


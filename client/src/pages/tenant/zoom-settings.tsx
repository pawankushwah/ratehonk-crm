import { Layout } from "@/components/layout/layout";
import { ZoomAccountManager } from "@/components/zoom/zoom-account-manager";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function ZoomSettings() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation("/dashboard");
  };

  return (
    <Layout>
      <div className="p-8">
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

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zoom Phone Settings
          </h1>
          <p className="text-gray-600">
            Manage your Zoom Phone accounts and integrations
          </p>
        </div>

        {/* Zoom Account Manager */}
        <ZoomAccountManager />
      </div>
    </Layout>
  );
}


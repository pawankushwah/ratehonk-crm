import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Star,
  Loader2,
  Check,
  X,
  Phone,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { PortfolioHeader } from "@/components/layout/portfolio-header";

export default function PublicPackageView() {
  const { packageId } = useParams();
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch package data (public endpoint - no auth required)
  useEffect(() => {
    const fetchPackage = async () => {
      if (!packageId) {
        setError("Package ID is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/public/packages/${packageId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Package not found");
          } else {
            setError("Failed to load package");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPackageData(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching package:", err);
        setError("Failed to load package");
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [packageId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <PortfolioHeader showSignUpButton={true} showSignInButton={false} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading package...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <PortfolioHeader showSignUpButton={true} showSignInButton={false} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <X className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Not Found</h2>
              <p className="text-gray-600 mb-6">{error || "The package you're looking for doesn't exist."}</p>
              <Button asChild>
                <Link href="/portfolio">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const inclusions = Array.isArray(packageData.inclusions) ? packageData.inclusions : [];
  const exclusions = Array.isArray(packageData.exclusions) ? packageData.exclusions : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortfolioHeader showSignUpButton={true} showSignInButton={false} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Package Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/portfolio">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* Package Image */}
        {(packageData.packageStayingImage || packageData.image) && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
            <img
              src={packageData.packageStayingImage || packageData.image}
              alt={packageData.name}
              className="w-full h-[400px] object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Title */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                      {packageData.name}
                    </CardTitle>
                    {packageData.altName && (
                      <p className="text-gray-500 italic">{packageData.altName}</p>
                    )}
                  </div>
                  {packageData.rating && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-yellow-700">{packageData.rating}/5</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Package Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase">Destination</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{packageData.destination || "N/A"}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase">Duration</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{packageData.duration || 0} Days</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase">Capacity</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{packageData.maxCapacity || 0} Travelers</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase">Price</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">${parseFloat(packageData.price || 0).toFixed(2)}</p>
                  </div>
                </div>

                {/* Description */}
                {packageData.description && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Package</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {packageData.description}
                    </p>
                  </div>
                )}

                {/* Inclusions & Exclusions */}
                {(inclusions.length > 0 || exclusions.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inclusions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-600" />
                          What's Included
                        </h3>
                        <ul className="space-y-2">
                          {inclusions.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-gray-600">
                              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exclusions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <X className="h-5 w-5 text-red-600" />
                          What's Not Included
                        </h3>
                        <ul className="space-y-2">
                          {exclusions.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-gray-600">
                              <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book This Package</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center pb-6 border-b">
                  <div className="text-sm text-gray-500 mb-2">Starting From</div>
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    ${parseFloat(packageData.price || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Per person</div>
                </div>

                {/* Booking Button */}
                {packageData.paymentLink ? (
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
                    asChild
                  >
                    <a href={packageData.paymentLink} target="_blank" rel="noopener noreferrer">
                      Book Now & Pay
                    </a>
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
                    disabled
                  >
                    Booking Unavailable
                  </Button>
                )}

                {/* Contact Info */}
                <div className="pt-6 border-t space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Have Questions?</p>
                  {packageData.tenantContactEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${packageData.tenantContactEmail}`} className="hover:text-blue-600">
                        {packageData.tenantContactEmail}
                      </a>
                    </div>
                  )}
                  {packageData.tenantContactPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${packageData.tenantContactPhone}`} className="hover:text-blue-600">
                        {packageData.tenantContactPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="pt-4">
                  <Badge
                    variant={packageData.isActive ? "default" : "secondary"}
                    className={`w-full justify-center py-2 ${
                      packageData.isActive
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {packageData.isActive ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

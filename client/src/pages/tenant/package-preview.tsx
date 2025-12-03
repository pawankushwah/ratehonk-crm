import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Star,
  Check,
  X,
  Edit,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/auth";
import type { TravelPackage } from "@/lib/types";

export default function PackagePreview() {
  const { tenant } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/packages/preview/:id");
  
  const packageId = params?.id ? parseInt(params.id) : null;

  // Fetch package data
  const { data: pkg, isLoading } = useQuery<TravelPackage>({
    queryKey: [`/api/tenants/${tenant?.id}/packages/${packageId}`],
    enabled: !!tenant?.id && !!packageId,
    queryFn: async () => {
      const token = auth.getToken();
      const response = await fetch(`/api/tenants/${tenant?.id}/packages/${packageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch package");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading package details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!pkg) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-xl mb-4">Package not found</p>
            <Button onClick={() => navigate("/packages")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Packages
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Parse day-wise itinerary
  let dayWiseItinerary: any[] = [];
  if (pkg.dayWiseItinerary) {
    try {
      dayWiseItinerary = typeof pkg.dayWiseItinerary === "string"
        ? JSON.parse(pkg.dayWiseItinerary)
        : pkg.dayWiseItinerary;
    } catch (e) {
      console.error("Error parsing dayWiseItinerary:", e);
    }
  }

  // Parse itinerary images
  const itineraryImages = typeof pkg.itineraryImages === "string"
    ? pkg.itineraryImages.split(",").filter(img => img.trim())
    : Array.isArray(pkg.itineraryImages)
    ? pkg.itineraryImages
    : [];

  // Parse inclusions and exclusions
  const inclusions = Array.isArray(pkg.inclusions)
    ? pkg.inclusions
    : typeof pkg.inclusions === "string"
    ? pkg.inclusions.split("\n").filter(item => item.trim())
    : [];

  const exclusions = Array.isArray(pkg.exclusions)
    ? pkg.exclusions
    : typeof pkg.exclusions === "string"
    ? pkg.exclusions.split("\n").filter(item => item.trim())
    : [];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header with navigation */}
        <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/packages")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Packages
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/packages/edit/${pkg.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Package
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Section with Main Image */}
        {(pkg.packageStayingImage || pkg.image) && (
          <div className="relative w-full h-[500px] overflow-hidden">
            <img
              src={pkg.packageStayingImage || pkg.image}
              alt={pkg.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="container mx-auto">
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-blue-600 text-white">
                    {pkg.status || "Published"}
                  </Badge>
                  <Badge className={pkg.isActive ? "bg-green-600" : "bg-red-600"}>
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {pkg.rating && (
                    <Badge className="bg-yellow-600 text-white">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {pkg.rating}/5
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {pkg.name}
                </h1>
                {pkg.altName && (
                  <p className="text-xl text-gray-200 italic">Also known as: {pkg.altName}</p>
                )}
                {pkg.description && (
                  <p className="text-lg text-gray-200 mt-4 max-w-3xl">
                    {pkg.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-12">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Destination</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {pkg.destination}
                    </p>
                    {(pkg.region || pkg.country || pkg.city) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {pkg.region && `${pkg.region}`}
                        {pkg.country && `, ${pkg.country}`}
                        {pkg.city && `, ${pkg.city}`}
                      </p>
                    )}
                  </div>
                  <MapPin className="h-12 w-12 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {pkg.duration} Days
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pkg.duration - 1} Night{pkg.duration > 2 ? "s" : ""}
                    </p>
                  </div>
                  <Calendar className="h-12 w-12 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      ${pkg.price}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Per person</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Capacity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {pkg.maxCapacity}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Max travelers</p>
                  </div>
                  <Users className="h-12 w-12 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Info */}
          {pkg.vendorName && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-2">Provided By</h2>
                <p className="text-lg text-gray-700 dark:text-gray-300">{pkg.vendorName}</p>
              </CardContent>
            </Card>
          )}

          {/* Itinerary Images Gallery */}
          {itineraryImages.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Package Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {itineraryImages.map((imgUrl: string, index: number) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow">
                      <img
                        src={imgUrl.trim()}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Day-wise Itinerary */}
          {Array.isArray(dayWiseItinerary) && dayWiseItinerary.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Day-by-Day Itinerary</h2>
                <div className="space-y-8">
                  {dayWiseItinerary.map((day: any, index: number) => (
                    <div key={index} className="relative pl-8 pb-8 border-l-4 border-blue-500 last:pb-0">
                      <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{day.day}</span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <Badge className="mb-2">Day {day.day}</Badge>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {day.place}
                            </h3>
                          </div>
                        </div>
                        {day.itineraryDescription && (
                          <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                            {day.itineraryDescription}
                          </p>
                        )}
                        {day.itineraryImageNames && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                            {(() => {
                              const dayImages = typeof day.itineraryImageNames === 'string'
                                ? day.itineraryImageNames.split(',').filter((img: string) => img.trim())
                                : Array.isArray(day.itineraryImageNames)
                                ? day.itineraryImageNames
                                : [];
                              return dayImages.map((imgUrl: string, imgIndex: number) => (
                                <div key={imgIndex} className="aspect-square overflow-hidden rounded-lg shadow">
                                  <img
                                    src={imgUrl.trim()}
                                    alt={`Day ${day.day} image ${imgIndex + 1}`}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Itinerary Description */}
          {pkg.itineraryDescription && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Itinerary Overview</h2>
                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {pkg.itineraryDescription}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inclusions & Exclusions */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {inclusions.length > 0 && (
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center text-green-800 dark:text-green-400">
                    <Check className="h-6 w-6 mr-2" />
                    What's Included
                  </h2>
                  <ul className="space-y-3">
                    {inclusions.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {exclusions.length > 0 && (
              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-800/10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center text-red-800 dark:text-red-400">
                    <X className="h-6 w-6 mr-2" />
                    What's Not Included
                  </h2>
                  <ul className="space-y-3">
                    {exclusions.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <X className="h-5 w-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cancellation Policy */}
          {(pkg.cancellationPolicy || pkg.cancellationBenefit) && (
            <Card className="mb-8 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/10 dark:to-amber-800/10">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-amber-800 dark:text-amber-400">
                  Cancellation Policy
                </h2>
                {pkg.cancellationPolicy && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Policy Terms
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {pkg.cancellationPolicy}
                    </p>
                  </div>
                )}
                {pkg.cancellationBenefit && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Benefits
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {pkg.cancellationBenefit}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bottom CTA */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Book This Package?</h2>
              <p className="text-lg mb-6">Contact us to get started with your adventure</p>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate("/packages")}
                >
                  Browse More Packages
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => navigate(`/packages/edit/${pkg.id}`)}
                >
                  Edit This Package
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


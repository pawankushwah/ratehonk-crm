import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Plane, Hotel, Ship, MapPin, Car, UtensilsCrossed, Train, Bus, Star, Info } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

const API = (tenantId: number) => ({
  get: (id: number) => `/api/tenants/${tenantId}/itineraries/${id}`,
});

const getSectionIcon = (name: string) => {
  const n = (name || "").toLowerCase();
  if (n.includes("flight")) return Plane;
  if (n.includes("hotel") || n.includes("lodging")) return Hotel;
  if (n.includes("cruise")) return Ship;
  return MapPin;
};

const getItemIcon = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("flight")) return Plane;
  if (t.includes("hotel") || t.includes("lodging")) return Hotel;
  if (t.includes("cruise")) return Ship;
  if (t.includes("car") || t.includes("rental")) return Car;
  if (t.includes("restaurant")) return UtensilsCrossed;
  if (t.includes("train")) return Train;
  if (t.includes("transfer")) return Bus;
  if (t.includes("activity")) return Star;
  return Info;
};

export default function ItineraryPreview() {
  const { tenant } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/itineraries/preview/:id");
  const id = params?.id ? parseInt(params.id) : null;

  const { data: itinerary, isLoading } = useQuery({
    queryKey: ["itinerary-preview", id],
    enabled: !!tenant?.id && !!id,
    queryFn: async () => {
      const res = await fetch(API(tenant!.id).get(id!), {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (!tenant) return null;
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!itinerary) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-red-500 mb-4">Itinerary not found</p>
          <Button onClick={() => navigate("/itineraries")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Itineraries
          </Button>
        </div>
      </Layout>
    );
  }

  const sections = itinerary.sections || [];
  const currency = itinerary.currency || "INR";

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/itineraries")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/itineraries/${id}`)}>
            Edit itinerary
          </Button>
        </div>

        <Card className="mb-6 overflow-hidden">
          {itinerary.coverPhoto && (
            <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${itinerary.coverPhoto})` }} />
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{itinerary.title}</CardTitle>
            {itinerary.intro && <p className="text-gray-600 whitespace-pre-wrap">{itinerary.intro}</p>}
            {itinerary.signature && (
              <p className="text-lg italic mt-4" style={{ fontFamily: "cursive" }}>
                {itinerary.signature}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {currency} {(itinerary.clientPrice || 0).toFixed(2)} Client price · {currency} {(itinerary.agentProfit || 0).toFixed(2)} Your profit
            </p>
          </CardHeader>
        </Card>

        {sections.map((sec: any) => {
          const Icon = getSectionIcon(sec.sectionName);
          return (
            <Card key={sec.id} className="mb-4">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <h3 className="text-base font-semibold">{sec.sectionName}</h3>
                  {sec.sectionDate && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {sec.sectionDate}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {(sec.images || []).length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {(sec.images || []).map((img: string, i: number) => (
                      <img key={i} src={img} alt="" className="h-16 w-16 object-cover rounded border" />
                    ))}
                  </div>
                )}
                <ul className="space-y-2">
                  {(sec.items || []).map((item: any) => {
                    const ItemIcon = getItemIcon(item.itemType || "general");
                    return (
                      <li key={item.id} className="flex flex-col gap-2 p-2 rounded bg-gray-50">
                        <div className="flex items-start gap-2">
                          <ItemIcon className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                          </div>
                        </div>
                        {(item.images || []).length > 0 && (
                          <div className="flex gap-1 flex-wrap pl-6">
                            {(item.images || []).map((img: string, i: number) => (
                              <img key={i} src={img} alt="" className="h-12 w-12 object-cover rounded border" />
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}

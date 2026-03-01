import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plane, Hotel, Ship, MapPin, Car, UtensilsCrossed, Train, Bus, Star, Info, Loader2 } from "lucide-react";
import { PortfolioHeader } from "@/components/layout/portfolio-header";

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

export default function PublicItineraryView() {
  const { token } = useParams();
  const { data: itinerary, isLoading, error } = useQuery({
    queryKey: ["public-itinerary", token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`/api/public/itineraries/${token}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <PortfolioHeader showSignUpButton={true} showSignInButton={false} />
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <PortfolioHeader showSignUpButton={true} showSignInButton={false} />
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-red-500 mb-4">Itinerary not found or link has expired.</p>
        </div>
      </div>
    );
  }

  const sections = itinerary.sections || [];
  const currency = itinerary.currency || "INR";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortfolioHeader showSignUpButton={true} showSignInButton={false} />
      <div className="max-w-2xl mx-auto p-6 pb-16">
        <Card className="mb-6 overflow-hidden shadow-lg">
          {itinerary.coverPhoto && (
            <div className="h-56 bg-cover bg-center" style={{ backgroundImage: `url(${itinerary.coverPhoto})` }} />
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
            <Card key={sec.id} className="mb-4 shadow-md">
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
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { Clock, Luggage } from "lucide-react";
import type { FlightListApiData, FlightOption, ApiFilters } from "@/types/flight-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

function getStopsLabel(stops: number): string {
  if (stops === 0) return "Non-stop";
  if (stops === 1) return "1 Stop";
  return "2+ stops";
}

function getAirlineName(option: FlightOption): string {
  const seg = option.SegmentSummary?.[0];
  return seg?.AirlineDetails?.AirlineName ?? "Airline";
}

function getTotalFare(option: FlightOption): number {
  const p = option.FareDetails?.b2c_PriceDetails;
  if (!p) return 0;
  const n = typeof p.TotalFare === "string" ? parseFloat(p.TotalFare) : p.TotalFare;
  return Number.isFinite(n) ? n : 0;
}

function getStopsForOption(option: FlightOption): number {
  return option.totalStops ?? option.SegmentSummary?.[0]?.TotalStops ?? 0;
}

interface FlightResultsViewProps {
  data: FlightListApiData;
  onBack?: () => void;
  onSelectFlight?: (option: FlightOption, index: number) => void;
}

export function FlightResultsView({ data, onBack, onSelectFlight }: FlightResultsViewProps) {
  const filtersFromApi = data.filters ?? {};
  const priceRange = filtersFromApi.p ?? { min: 0, max: 100000 };
  const airlineFilters = filtersFromApi.airline ?? {};
  const stopsFilters = filtersFromApi.stops ?? {};

  const [priceMin, setPriceMin] = useState(priceRange.min);
  const [priceMax, setPriceMax] = useState(priceRange.max);
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(new Set());
  const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"cheapest" | "fastest">("cheapest");

  const rawFlights = data.raw_flight_list?.Flights ?? [];
  const journey = data.raw_flight_list?.JourneySummary;
  const origin = journey?.Origin ?? "";
  const destination = journey?.Destination ?? "";

  const flatOptions = useMemo(() => {
    const out: { option: FlightOption; index: number }[] = [];
    rawFlights.forEach((row, i) => {
      if (Array.isArray(row)) {
        row.forEach((opt) => {
          if (opt && opt.SegmentSummary) out.push({ option: opt, index: out.length });
        });
      }
    });
    return out;
  }, [rawFlights]);

  const filteredOptions = useMemo(() => {
    let list = flatOptions.slice();

    const priceMinN = Number(priceMin);
    const priceMaxN = Number(priceMax);
    if (Number.isFinite(priceMinN) && Number.isFinite(priceMaxN)) {
      list = list.filter(({ option }) => {
        const fare = getTotalFare(option);
        return fare >= priceMinN && fare <= priceMaxN;
      });
    }

    if (selectedAirlines.size > 0) {
      list = list.filter(({ option }) => selectedAirlines.has(getAirlineName(option)));
    }

    if (selectedStops.size > 0) {
      list = list.filter(({ option }) => {
        const stops = getStopsForOption(option);
        const label = getStopsLabel(stops);
        return selectedStops.has(label);
      });
    }

    if (sortBy === "cheapest") {
      list.sort((a, b) => getTotalFare(a.option) - getTotalFare(b.option));
    } else {
      list.sort((a, b) => {
        const durA = a.option.SegmentSummary?.[0]?.TotalDuaration ?? "";
        const durB = b.option.SegmentSummary?.[0]?.TotalDuaration ?? "";
        return durA.localeCompare(durB);
      });
    }

    return list;
  }, [flatOptions, priceMin, priceMax, selectedAirlines, selectedStops, sortBy]);

  const toggleAirline = (name: string) => {
    setSelectedAirlines((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleStop = (label: string) => {
    setSelectedStops((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const resetFilters = () => {
    setPriceMin(priceRange.min);
    setPriceMax(priceRange.max);
    setSelectedAirlines(new Set());
    setSelectedStops(new Set());
  };

  const currencySymbol = flatOptions[0]?.option?.FareDetails?.b2c_PriceDetails?.CurrencySymbol ?? "₹";

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Filters sidebar */}
      <aside className="w-full lg:w-72 shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Filter by</h3>
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:underline"
          >
            Reset
          </button>
        </div>

        {/* Price min/max */}
        <div className="space-y-2">
          <Label className="text-gray-700">Price range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={priceRange.min}
              max={priceRange.max}
              value={priceMin}
              onChange={(e) => setPriceMin(Number(e.target.value) || priceRange.min)}
              className="w-full"
            />
            <span className="text-gray-500">–</span>
            <Input
              type="number"
              min={priceRange.min}
              max={priceRange.max}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value) || priceRange.max)}
              className="w-full"
            />
          </div>
          <p className="text-xs text-gray-500">
            {currencySymbol} {priceRange.min.toLocaleString()} – {currencySymbol} {priceRange.max.toLocaleString()}
          </p>
        </div>

        {/* Airlines (names from API) */}
        <div className="space-y-2">
          <Label className="text-gray-700">Airlines</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(airlineFilters).map(([name, info]) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedAirlines.has(name)}
                  onCheckedChange={() => toggleAirline(name)}
                />
                <span className="text-sm text-gray-800">{name}</span>
                <span className="text-xs text-gray-500">({info.c})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Stops */}
        <div className="space-y-2">
          <Label className="text-gray-700">Stops</Label>
          <div className="space-y-2">
            {Object.entries(stopsFilters).map(([label, info]) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedStops.has(label)}
                  onCheckedChange={() => toggleStop(label)}
                />
                <span className="text-sm text-gray-800">{label}</span>
                <span className="text-xs text-gray-500">({info.c})</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            {onBack && (
              <Button type="button" variant="ghost" size="sm" onClick={onBack} className="mb-2">
                ← Back to search
              </Button>
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {origin} → {destination}
            </h2>
            <p className="text-sm text-gray-500">
              {filteredOptions.length} flight{filteredOptions.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort:</span>
            <Button
              type="button"
              variant={sortBy === "cheapest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("cheapest")}
            >
              Cheapest
            </Button>
            <Button
              type="button"
              variant={sortBy === "fastest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("fastest")}
            >
              Fastest
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredOptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No flights match the current filters. Try adjusting price range, airlines, or stops.
              </CardContent>
            </Card>
          ) : (
            filteredOptions.map(({ option, index }) => {
              const seg = option.SegmentSummary?.[0];
              const originDet = seg?.OriginDetails;
              const destDet = seg?.DestinationDetails;
              const airlineName = getAirlineName(option);
              const flightNumber = seg?.AirlineDetails?.FlightNumber ?? "";
              const duration = seg?.TotalDuaration ?? "";
              const stops = getStopsForOption(option);
              const fare = getTotalFare(option);
              const priceDetails = option.FareDetails?.b2c_PriceDetails;
              const currencySym = priceDetails?.CurrencySymbol ?? "₹";
              const segmentDetail = option.SegmentDetails?.[0]?.[0];
              const baggage = segmentDetail?.Baggage ?? "";
              const cabinBaggage = segmentDetail?.CabinBaggage ?? "";
              const refundable = option.Attr?.IsRefundable ?? false;
              const fareType = option.Attr?.FareType ?? "";

              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{airlineName}</span>
                          <span className="text-sm text-gray-600">
                            {seg?.AirlineDetails?.AirlineCode ?? ""} {flightNumber}
                          </span>
                          {fareType && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {fareType}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {originDet?._DateTime ?? ""}
                            </span>
                            <span className="text-sm text-gray-500">
                              {originDet?.AirportCode ?? ""} · {originDet?.CityName ?? ""}
                            </span>
                            {originDet?.Terminal && (
                              <span className="text-xs text-gray-500">{originDet.Terminal}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{duration}</span>
                            {stops > 0 && (
                              <span className="text-xs">· {getStopsLabel(stops)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {destDet?._DateTime ?? ""}
                            </span>
                            <span className="text-sm text-gray-500">
                              {destDet?.AirportCode ?? ""} · {destDet?.CityName ?? ""}
                            </span>
                            {destDet?.Terminal && (
                              <span className="text-xs text-gray-500">{destDet.Terminal}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {baggage && (
                            <span className="flex items-center gap-1">
                              <Luggage className="h-4 w-4" />
                              Baggage: {baggage}
                            </span>
                          )}
                          {cabinBaggage && (
                            <span>Cabin: {cabinBaggage}</span>
                          )}
                          <span>
                            {refundable ? "Refundable" : "Non-Refundable"}
                          </span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                        <div className="text-xl font-semibold text-gray-900">
                          {currencySym}{fare.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-gray-500">All-inclusive price</div>
                        {onSelectFlight && (
                          <Button
                            size="sm"
                            onClick={() => onSelectFlight(option, index)}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

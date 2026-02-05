/**
 * Types for flight list API response (e.g. faredown.com format).
 * Use these when parsing data.data.raw_flight_list and data.data.filters.
 */

export interface AirlineDetails {
  AirlineCode: string;
  AirlineName: string;
  FlightNumber: string;
  FareClass: string | null;
  FareClassCode: string | null;
}

export interface LocationDetails {
  AirportCode: string;
  CityName: string;
  AirportName: string;
  DateTime: string;
  Terminal?: string;
  _DateTime: string;
  _Date: string;
}

export interface SegmentSummary {
  AirlineDetails: AirlineDetails;
  OriginDetails: LocationDetails;
  DestinationDetails: LocationDetails;
  TotalStops: number;
  TotalDuaration: string;
  Stopdetails: unknown[];
}

export interface PriceDetails {
  BaseFare: string;
  TotalTax: number;
  TotalFare: number;
  Currency: string;
  CurrencySymbol: string;
}

export interface SegmentDetail {
  Baggage: string;
  CabinBaggage: string;
  AirlineDetails: AirlineDetails;
  OriginDetails: LocationDetails;
  DestinationDetails: LocationDetails;
  SegmentDuration: string;
}

export interface FlightOption {
  SegmentSummary: SegmentSummary[];
  SegmentDetails: SegmentDetail[][];
  FareDetails: {
    b2c_PriceDetails: PriceDetails;
    [key: string]: unknown;
  };
  totalStops: number;
  Attr?: {
    IsRefundable?: boolean;
    FareType?: string;
    IsLCC?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ApiFilters {
  p?: { min: number; max: number };
  airline?: Record<string, { c: number; v: string }>;
  stops?: Record<string, { c: number; v: string }>;
}

export interface RawFlightList {
  JourneySummary: {
    Origin: string;
    Destination: string;
    IsDomestic: boolean;
    [key: string]: unknown;
  };
  Flights: FlightOption[][];
}

export interface FlightListApiData {
  raw_flight_list: RawFlightList;
  filters: ApiFilters;
  search_id?: number;
  cabin_class?: string;
  trip_type?: string;
  [key: string]: unknown;
}

export interface FlightListApiResponse {
  status: boolean;
  message: string;
  data: {
    status: number;
    data: FlightListApiData;
    msg: unknown[];
    search_params?: unknown;
  };
}

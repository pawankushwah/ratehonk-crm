import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Users, 
  MapPin, 
  Plane, 
  Hotel,
  Car,
  Activity,
  TreePalm,
  Package,
  ArrowUpDown,
  ChevronDown,
  Clock
} from 'lucide-react';
import { Layout } from '@/components/layout/layout';

// Mock airport data
const airports = [
  { code: 'NYC', name: 'New York City', city: 'New York', fullName: 'John F. Kennedy International Airport' },
  { code: 'LAX', name: 'Los Angeles', city: 'Los Angeles', fullName: 'Los Angeles International Airport' },
  { code: 'LHR', name: 'London', city: 'London', fullName: 'London Heathrow Airport' },
  { code: 'DXB', name: 'Dubai', city: 'Dubai', fullName: 'Dubai International Airport' },
  { code: 'SIN', name: 'Singapore', city: 'Singapore', fullName: 'Singapore Changi Airport' },
  { code: 'NRT', name: 'Tokyo', city: 'Tokyo', fullName: 'Tokyo Narita Airport' },
  { code: 'CDG', name: 'Paris', city: 'Paris', fullName: 'Paris Charles de Gaulle Airport' },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', fullName: 'Frankfurt Airport' },
  { code: 'SYD', name: 'Sydney', city: 'Sydney', fullName: 'Sydney Kingsford Smith Airport' },
  { code: 'JFK', name: 'New York', city: 'New York', fullName: 'John F. Kennedy International Airport' }
];

// Mock destinations data
const destinations = [
  { id: 1, name: 'New York City', country: 'USA', hotels: 245 },
  { id: 2, name: 'Paris', country: 'France', hotels: 189 },
  { id: 3, name: 'London', country: 'UK', hotels: 156 },
  { id: 4, name: 'Dubai', country: 'UAE', hotels: 98 },
  { id: 5, name: 'Tokyo', country: 'Japan', hotels: 134 },
  { id: 6, name: 'Barcelona', country: 'Spain', hotels: 87 },
  { id: 7, name: 'Rome', country: 'Italy', hotels: 112 },
  { id: 8, name: 'Amsterdam', country: 'Netherlands', hotels: 76 },
  { id: 9, name: 'Bangkok', country: 'Thailand', hotels: 145 },
  { id: 10, name: 'Singapore', country: 'Singapore', hotels: 89 }
];

const Hotels = () => {
  const [activeTab, setActiveTab] = useState('hotels');
  
  // Flight form state
  const [tripType, setTripType] = useState('roundtrip');
  const [classType, setClassType] = useState('economy');
  const [directFlight, setDirectFlight] = useState(false);
  const [altDays, setAltDays] = useState(false);
  
  const [flightForm, setFlightForm] = useState({
    from: '',
    to: '',
    departure: '2025-09-08',
    return: '2025-09-15',
    travelers: 1
  });

  // Hotel form state
  const [hotelForm, setHotelForm] = useState({
    destination: '',
    checkIn: '2025-09-07',
    checkOut: '2025-09-07',
    nights: 1,
    adults: 2,
    rooms: 1
  });

  // Car form state
  const [carForm, setCarForm] = useState({
    pickupLocation: '',
    pickupDate: '2025-09-08',
    pickupTime: '10:00',
    returnDate: '2025-09-15',
    returnTime: '10:00',
    age: 25
  });

  // Activities form state
  const [activityForm, setActivityForm] = useState({
    destination: '',
    date: '2025-09-08',
    travelers: 2,
    category: 'all'
  });

  // Holiday form state
  const [holidayForm, setHolidayForm] = useState({
    destination: '',
    departure: '2025-09-08',
    duration: 7,
    travelers: 2,
    budget: 'mid-range'
  });

  // Package form state
  const [packageForm, setPackageForm] = useState({
    destination: '',
    departure: '2025-09-08',
    duration: 5,
    travelers: 2,
    type: 'flight-hotel'
  });

  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<typeof airports>([]);
  const [toSuggestions, setToSuggestions] = useState<typeof airports>([]);
  const [destSuggestions, setDestSuggestions] = useState<typeof destinations>([]);

  const handleAirportSearch = (query: string, type: 'from' | 'to') => {
    const filtered = airports.filter(airport => 
      airport.name.toLowerCase().includes(query.toLowerCase()) ||
      airport.code.toLowerCase().includes(query.toLowerCase()) ||
      airport.city.toLowerCase().includes(query.toLowerCase())
    );
    
    if (type === 'from') {
      setFromSuggestions(filtered);
      setShowFromSuggestions(query.length > 0);
    } else {
      setToSuggestions(filtered);
      setShowToSuggestions(query.length > 0);
    }
  };

  const handleDestinationSearch = (query: string) => {
    const filtered = destinations.filter(dest => 
      dest.name.toLowerCase().includes(query.toLowerCase()) ||
      dest.country.toLowerCase().includes(query.toLowerCase())
    );
    setDestSuggestions(filtered);
    setShowDestSuggestions(query.length > 0);
  };

  const selectAirport = (airport: typeof airports[0], type: 'from' | 'to') => {
    if (type === 'from') {
      setFlightForm(prev => ({ ...prev, from: `${airport.city}` }));
      setShowFromSuggestions(false);
    } else {
      setFlightForm(prev => ({ ...prev, to: `${airport.city}` }));
      setShowToSuggestions(false);
    }
  };

  const selectDestination = (destination: typeof destinations[0], formType: string) => {
    const destString = `${destination.name}, ${destination.country}`;
    setShowDestSuggestions(false);
    
    if (formType === 'hotel') {
      setHotelForm(prev => ({ ...prev, destination: destString }));
    } else if (formType === 'car') {
      setCarForm(prev => ({ ...prev, pickupLocation: destString }));
    } else if (formType === 'activity') {
      setActivityForm(prev => ({ ...prev, destination: destString }));
    } else if (formType === 'holiday') {
      setHolidayForm(prev => ({ ...prev, destination: destString }));
    } else if (formType === 'package') {
      setPackageForm(prev => ({ ...prev, destination: destString }));
    }
  };

  const swapAirports = () => {
    setFlightForm(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Searching ${activeTab}:`, getCurrentFormData());
  };

  const getCurrentFormData = () => {
    switch (activeTab) {
      case 'flights': return flightForm;
      case 'hotels': return hotelForm;
      case 'cars': return carForm;
      case 'activities': return activityForm;
      case 'holidays': return holidayForm;
      case 'packages': return packageForm;
      default: return {};
    }
  };

  const tabs = [
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'cars', label: 'Cars', icon: Car },
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'holidays', label: 'Holidays', icon: TreePalm },
    { id: 'packages', label: 'Packages', icon: Package }
  ];

  const renderFlightForm = () => (
    <>
      {/* Trip Type Selector */}
      <div className="bg-gray-900 px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-white cursor-pointer">
              <input
                type="radio"
                name="tripType"
                value="oneway"
                checked={tripType === 'oneway'}
                onChange={(e) => setTripType(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">One Way</span>
            </label>
            <label className="flex items-center space-x-2 text-white cursor-pointer">
              <input
                type="radio"
                name="tripType"
                value="roundtrip"
                checked={tripType === 'roundtrip'}
                onChange={(e) => setTripType(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">RoundTrip</span>
            </label>
            <label className="flex items-center space-x-2 text-white cursor-pointer">
              <input
                type="radio"
                name="tripType"
                value="multicity"
                checked={tripType === 'multicity'}
                onChange={(e) => setTripType(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">Multi-City</span>
            </label>
          </div>

          <div className="flex items-center space-x-6">
            <select
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="economy">Economy</option>
              <option value="premium">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>

            <label className="flex items-center space-x-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={altDays}
                onChange={(e) => setAltDays(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-medium">Alt. Days</span>
            </label>

            <label className="flex items-center space-x-3 text-white cursor-pointer">
              <span className="font-medium">Direct Flight</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={directFlight}
                  onChange={(e) => setDirectFlight(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${directFlight ? 'bg-blue-600' : 'bg-gray-400'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full mt-1 ml-1 transition-transform ${directFlight ? 'translate-x-5' : ''}`}></div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Flight Search Form */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {/* From Field */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold text-gray-900 mb-2">From</label>
            <div className="relative">
              <input
                type="text"
                value={flightForm.from}
                onChange={(e) => {
                  setFlightForm(prev => ({ ...prev, from: e.target.value }));
                  handleAirportSearch(e.target.value, 'from');
                }}
                onFocus={() => flightForm.from && handleAirportSearch(flightForm.from, 'from')}
                placeholder="From City"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500 mt-1 px-4">International Airport</div>

              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {fromSuggestions.map((airport) => (
                    <button
                      key={airport.code}
                      type="button"
                      onClick={() => selectAirport(airport, 'from')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900">{airport.city}</div>
                      <div className="text-sm text-gray-600">{airport.fullName}</div>
                      <div className="text-xs text-gray-500">{airport.code}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <div className="lg:col-span-1 flex items-end justify-center pb-3">
            <button
              type="button"
              onClick={swapAirports}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowUpDown className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* To Field */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold text-gray-900 mb-2">To</label>
            <div className="relative">
              <input
                type="text"
                value={flightForm.to}
                onChange={(e) => {
                  setFlightForm(prev => ({ ...prev, to: e.target.value }));
                  handleAirportSearch(e.target.value, 'to');
                }}
                onFocus={() => flightForm.to && handleAirportSearch(flightForm.to, 'to')}
                placeholder="To City"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500 mt-1 px-4">International Airport</div>

              {showToSuggestions && toSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {toSuggestions.map((airport) => (
                    <button
                      key={airport.code}
                      type="button"
                      onClick={() => selectAirport(airport, 'to')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900">{airport.city}</div>
                      <div className="text-sm text-gray-600">{airport.fullName}</div>
                      <div className="text-xs text-gray-500">{airport.code}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Departure Date */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Departure</label>
            <div className="relative">
              <input
                type="date"
                value={flightForm.departure}
                onChange={(e) => setFlightForm(prev => ({ ...prev, departure: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <div className="text-xs text-gray-500 mt-1 px-4">Monday</div>
            </div>
          </div>

          {/* Return Date */}
          {tripType === 'roundtrip' && (
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Return</label>
              <div className="relative">
                <input
                  type="date"
                  value={flightForm.return}
                  onChange={(e) => setFlightForm(prev => ({ ...prev, return: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                <div className="text-xs text-gray-500 mt-1 px-4">Monday</div>
              </div>
            </div>
          )}

          {/* Travelers */}
          <div className={`lg:col-span-1 ${tripType === 'oneway' ? 'lg:col-start-5' : ''}`}>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Travelers</label>
            <div className="relative">
              <select
                value={flightForm.travelers}
                onChange={(e) => setFlightForm(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg appearance-none"
              >
                {[1,2,3,4,5,6,7,8].map(num => (
                  <option key={num} value={num}>
                    {num} Traveller{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderHotelForm = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Going to Field */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Going to</label>
          <div className="relative">
            <input
              type="text"
              value={hotelForm.destination}
              onChange={(e) => {
                setHotelForm(prev => ({ ...prev, destination: e.target.value }));
                handleDestinationSearch(e.target.value);
              }}
              onFocus={() => hotelForm.destination && handleDestinationSearch(hotelForm.destination)}
              onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
              placeholder="Region, City, Area (Worldwide)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>

            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {destSuggestions.map((destination) => (
                  <button
                    key={destination.id}
                    type="button"
                    onClick={() => selectDestination(destination, 'hotel')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-semibold text-gray-900">{destination.name}</div>
                    <div className="text-sm text-gray-600">{destination.country}</div>
                    <div className="text-xs text-gray-500">{destination.hotels} hotels</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Check-in Date */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Check-in</label>
          <div className="relative">
            <input
              type="date"
              value={hotelForm.checkIn}
              onChange={(e) => setHotelForm(prev => ({ ...prev, checkIn: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="text-xs text-gray-500 mt-1 px-4">07-09-2025</div>
          </div>
        </div>

        {/* Check-out Date */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Check-out</label>
          <div className="relative">
            <input
              type="date"
              value={hotelForm.checkOut}
              onChange={(e) => setHotelForm(prev => ({ ...prev, checkOut: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="text-xs text-gray-500 mt-1 px-4">07-09-2025</div>
          </div>
        </div>

        {/* No. of Nights */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">No.of Nights</label>
          <div className="relative">
            <select
              value={hotelForm.nights}
              onChange={(e) => setHotelForm(prev => ({ ...prev, nights: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg appearance-none"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(num => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Guests & Rooms */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Guests & Rooms</label>
          <div className="relative">
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-lg cursor-pointer">
              <div className="flex justify-between items-center">
                <span>{hotelForm.adults} Adults | {hotelForm.rooms} Room</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCarForm = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Pickup Location */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Pickup Location</label>
          <div className="relative">
            <input
              type="text"
              value={carForm.pickupLocation}
              onChange={(e) => {
                setCarForm(prev => ({ ...prev, pickupLocation: e.target.value }));
                handleDestinationSearch(e.target.value);
              }}
              placeholder="City, Airport, Station, Region"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Pickup Date & Time */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Pickup Date</label>
          <input
            type="date"
            value={carForm.pickupDate}
            onChange={(e) => setCarForm(prev => ({ ...prev, pickupDate: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <div className="mt-2">
            <input
              type="time"
              value={carForm.pickupTime}
              onChange={(e) => setCarForm(prev => ({ ...prev, pickupTime: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Return Date & Time */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Return Date</label>
          <input
            type="date"
            value={carForm.returnDate}
            onChange={(e) => setCarForm(prev => ({ ...prev, returnDate: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <div className="mt-2">
            <input
              type="time"
              value={carForm.returnTime}
              onChange={(e) => setCarForm(prev => ({ ...prev, returnTime: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Driver's Age */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Driver's Age</label>
          <select
            value={carForm.age}
            onChange={(e) => setCarForm(prev => ({ ...prev, age: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg appearance-none"
          >
            {Array.from({ length: 51 }, (_, i) => i + 18).map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderActivityForm = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Destination */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Destination</label>
          <div className="relative">
            <input
              type="text"
              value={activityForm.destination}
              onChange={(e) => {
                setActivityForm(prev => ({ ...prev, destination: e.target.value }));
                handleDestinationSearch(e.target.value);
              }}
              placeholder="Where do you want to explore?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Date</label>
          <input
            type="date"
            value={activityForm.date}
            onChange={(e) => setActivityForm(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        {/* Travelers */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Travelers</label>
          <select
            value={activityForm.travelers}
            onChange={(e) => setActivityForm(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg appearance-none"
          >
            {[1,2,3,4,5,6,7,8].map(num => (
              <option key={num} value={num}>{num} {num > 1 ? 'People' : 'Person'}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderHolidayForm = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Destination */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Destination</label>
          <div className="relative">
            <input
              type="text"
              value={holidayForm.destination}
              onChange={(e) => {
                setHolidayForm(prev => ({ ...prev, destination: e.target.value }));
                handleDestinationSearch(e.target.value);
              }}
              placeholder="Where would you like to go?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <TreePalm className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Departure Date */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Departure</label>
          <input
            type="date"
            value={holidayForm.departure}
            onChange={(e) => setHolidayForm(prev => ({ ...prev, departure: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        {/* Duration */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Duration</label>
          <select
            value={holidayForm.duration}
            onChange={(e) => setHolidayForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg appearance-none"
          >
            {[3,4,5,6,7,8,9,10,11,12,13,14].map(days => (
              <option key={days} value={days}>{days} Days</option>
            ))}
          </select>
        </div>

        {/* Travelers */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Travelers</label>
          <select
            value={holidayForm.travelers}
            onChange={(e) => setHolidayForm(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg appearance-none"
          >
            {[1,2,3,4,5,6,7,8].map(num => (
              <option key={num} value={num}>{num} {num > 1 ? 'Travelers' : 'Traveler'}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderPackageForm = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Destination */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Destination</label>
          <div className="relative">
            <input
              type="text"
              value={packageForm.destination}
              onChange={(e) => {
                setPackageForm(prev => ({ ...prev, destination: e.target.value }));
                handleDestinationSearch(e.target.value);
              }}
              placeholder="Choose your destination"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Departure Date */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Departure</label>
          <input
            type="date"
            value={packageForm.departure}
            onChange={(e) => setPackageForm(prev => ({ ...prev, departure: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        {/* Package Type */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Package Type</label>
          <select
            value={packageForm.type}
            onChange={(e) => setPackageForm(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg appearance-none"
          >
            <option value="flight-hotel">Flight + Hotel</option>
            <option value="all-inclusive">All Inclusive</option>
            <option value="flight-hotel-car">Flight + Hotel + Car</option>
            <option value="custom">Custom Package</option>
          </select>
        </div>

        {/* Travelers */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Travelers</label>
          <select
            value={packageForm.travelers}
            onChange={(e) => setPackageForm(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg appearance-none"
          >
            {[1,2,3,4,5,6,7,8].map(num => (
              <option key={num} value={num}>{num} {num > 1 ? 'Travelers' : 'Traveler'}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderActiveForm = () => {
    switch (activeTab) {
      case 'flights':
        return renderFlightForm();
      case 'hotels':
        return renderHotelForm();
      case 'cars':
        return renderCarForm();
      case 'activities':
        return renderActivityForm();
      case 'holidays':
        return renderHolidayForm();
      case 'packages':
        return renderPackageForm();
      default:
        return renderHotelForm();
    }
  };

  const getSearchButtonText = () => {
    switch (activeTab) {
      case 'flights': return 'SEARCH FLIGHT';
      case 'hotels': return 'SEARCH HOTEL';
      case 'cars': return 'SEARCH CAR';
      case 'activities': return 'SEARCH ACTIVITIES';
      case 'holidays': return 'SEARCH HOLIDAYS';
      case 'packages': return 'SEARCH PACKAGES';
      default: return 'SEARCH';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen w-full relative overflow-hidden">
        {/* Tropical Sky Background */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-blue-200 via-blue-300 to-teal-400"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M40 40c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm20 0c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Palm trees and tropical elements */}
          <div className="absolute top-8 left-16 w-40 h-24 bg-white bg-opacity-15 rounded-full blur-sm animate-float"></div>
          <div className="absolute top-24 right-24 w-48 h-28 bg-white bg-opacity-12 rounded-full blur-sm animate-float-delay"></div>
          <div className="absolute top-16 right-16 w-32 h-16 bg-white bg-opacity-20 rounded-full blur-sm animate-float"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-teal-500 to-transparent opacity-30"></div>
        </div>

        {/* Page Header */}
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between px-4 bg-transparent">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] text-white font-medium leading-6 tracking-normal">
              Travel Booking
            </h1>
          </div>
        </header>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
          {/* Navigation Tabs */}
          <div className="mb-8 bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-2 shadow-xl">
            <div className="flex items-center space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Form Container */}
          <div className="w-full max-w-6xl bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSearch}>
              {renderActiveForm()}

              {/* Search Button */}
              <div className="flex justify-center pb-6">
                <button
                  type="submit"
                  className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
                >
                  <Search className="w-6 h-6" />
                  <span>{getSearchButtonText()}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Hotels;
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plane, 
  Clock, 
  MapPin, 
  Users, 
  Wifi, 
  Monitor, 
  Coffee, 
  Utensils,
  Star,
  Shield,
  CreditCard,
  Calendar,
  Luggage,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Layout } from "@/components/layout/layout";

// Mock detailed flight data
const flightDetails = {
  id: 'EK205',
  airline: 'Emirates',
  aircraftType: 'Boeing 777-300ER',
  flightNumber: 'EK 205',
  from: {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    terminal: 'Terminal 4'
  },
  to: {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    terminal: 'Terminal 3'
  },
  departure: {
    time: '23:55',
    date: '2025-09-15',
    timezone: 'EDT'
  },
  arrival: {
    time: '19:20',
    date: '2025-09-16',
    timezone: 'GST'
  },
  duration: '12h 25m',
  distance: '6,837 miles',
  stops: [],
  amenities: ['WiFi', 'Entertainment', 'Meals', 'Power Outlets'],
  baggage: {
    carry: '1 x 7kg',
    checked: '1 x 23kg included'
  },
  cancellation: 'Free cancellation within 24 hours',
  price: {
    base: 1199,
    taxes: 89,
    fees: 11,
    total: 1299
  }
};

const seatMap = {
  economy: {
    available: 156,
    price: 0,
    features: ['Standard seat', 'Meal included', 'Entertainment system']
  },
  premiumEconomy: {
    available: 24,
    price: 299,
    features: ['Extra legroom', 'Priority boarding', 'Enhanced meal', 'Premium entertainment']
  },
  business: {
    available: 8,
    price: 1200,
    features: ['Lie-flat bed', 'À la carte dining', 'Priority check-in', 'Lounge access']
  },
  first: {
    available: 2,
    price: 2500,
    features: ['Private suite', 'Shower spa', 'Personal mini-bar', 'Chauffeur service']
  }
};

const FlightDetails = ({ onBack = () => {} }) => {
  const [selectedClass, setSelectedClass] = useState('economy');
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showAmenities, setShowAmenities] = useState(false);
  const [showBaggageInfo, setShowBaggageInfo] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const totalPrice = flightDetails.price.total + seatMap[selectedClass].price;

  return (
    <Layout>
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-[#0E76BC] hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {/* <span>Back to Results</span> */}
            <a
                href="/flights"
                className=" h-5"
              >
                Back to Results
              </a>
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">{flightDetails.airline} {flightDetails.flightNumber}</h1>
              <p className="text-sm text-gray-600">{flightDetails.from.city} → {flightDetails.to.city}</p>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-[#0E76BC]">${totalPrice}</p>
              <p className="text-sm text-gray-600">per person</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Timeline */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <Plane className="w-6 h-6 mr-2 text-[#0E76BC]" />
                  Flight Details
                </h2>
                
                <div className="relative">
                  {/* Timeline */}
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    {/* Departure */}
                    <div className="text-center md:text-left mb-6 md:mb-0">
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        {formatTime(flightDetails.departure.time)}
                      </div>
                      <div className="text-lg font-semibold text-gray-700 mb-1">
                        {flightDetails.from.code}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {flightDetails.from.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(flightDetails.departure.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {flightDetails.from.terminal}
                      </div>
                    </div>

                    {/* Flight Path */}
                    <div className="flex-1 mx-8 hidden md:block">
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-600 mb-2">{flightDetails.duration}</div>
                        <div className="relative">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-[#0E76BC] rounded-full"></div>
                            <div className="flex-1 h-px bg-gray-300 mx-2"></div>
                            <Plane className="w-6 h-6 text-[#0E76BC] transform rotate-45" />
                            <div className="flex-1 h-px bg-gray-300 mx-2"></div>
                            <div className="w-3 h-3 bg-[#0E76BC] rounded-full"></div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          {flightDetails.stops.length === 0 ? 'Non-stop' : `${flightDetails.stops.length} stop(s)`}
                        </div>
                        <div className="text-sm text-gray-500">{flightDetails.distance}</div>
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="text-center md:text-right">
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        {formatTime(flightDetails.arrival.time)}
                      </div>
                      <div className="text-lg font-semibold text-gray-700 mb-1">
                        {flightDetails.to.code}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {flightDetails.to.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(flightDetails.arrival.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {flightDetails.to.terminal}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Timeline */}
                  <div className="block md:hidden mt-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">{flightDetails.duration}</div>
                      <div className="text-sm text-gray-600">
                        {flightDetails.stops.length === 0 ? 'Non-stop' : `${flightDetails.stops.length} stop(s)`}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{flightDetails.distance}</div>
                    </div>
                  </div>
                </div>

                {/* Aircraft Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Aircraft</p>
                      <p className="text-sm text-gray-600">{flightDetails.aircraftType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Flight Number</p>
                      <p className="text-sm text-gray-600">{flightDetails.flightNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowAmenities(!showAmenities)}
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Coffee className="w-5 h-5 mr-2 text-[#0E76BC]" />
                    Amenities & Services
                  </h3>
                  {showAmenities ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>
              
              {showAmenities && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Wifi, label: 'Wi-Fi', desc: 'Complimentary' },
                      { icon: Monitor, label: 'Entertainment', desc: '1000+ movies' },
                      { icon: Utensils, label: 'Meals', desc: 'Multiple options' },
                      { icon: Coffee, label: 'Beverages', desc: 'Complimentary' }
                    ].map((amenity, index) => (
                      <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                        <amenity.icon className="w-8 h-8 mx-auto mb-2 text-[#0E76BC]" />
                        <p className="font-medium text-sm">{amenity.label}</p>
                        <p className="text-xs text-gray-600 mt-1">{amenity.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Baggage Information */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowBaggageInfo(!showBaggageInfo)}
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Luggage className="w-5 h-5 mr-2 text-[#0E76BC]" />
                    Baggage Information
                  </h3>
                  {showBaggageInfo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>
              
              {showBaggageInfo && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Carry-on Baggage</h4>
                      <p className="text-blue-800">{flightDetails.baggage.carry}</p>
                      <p className="text-sm text-blue-700 mt-1">55cm x 40cm x 20cm</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Checked Baggage</h4>
                      <p className="text-green-800">{flightDetails.baggage.checked}</p>
                      <p className="text-sm text-green-700 mt-1">Max dimensions: 158cm</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Airline Policies */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-[#0E76BC]" />
                Policies & Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-[#0E76BC] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Cancellation Policy</p>
                    <p className="text-sm text-gray-600">{flightDetails.cancellation}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-[#0E76BC] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Date Change</p>
                    <p className="text-sm text-gray-600">Changes allowed with fee starting from $150</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-[#0E76BC] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Check-in</p>
                    <p className="text-sm text-gray-600">Online check-in opens 24 hours before departure</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-[#0E76BC]" />
                Airline Reviews
              </h3>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">4.2 out of 5 (1,247 reviews)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { category: 'Service', rating: 4.3 },
                  { category: 'Comfort', rating: 4.1 },
                  { category: 'Entertainment', rating: 4.4 }
                ].map((review) => (
                  <div key={review.category} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{review.category}</p>
                    <p className="text-xl font-bold text-[#0E76BC]">{review.rating}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm sticky top-24">
              {/* Class Selection */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Select Your Class</h3>
                <div className="space-y-3">
                  {Object.entries(seatMap).map(([classKey, classData]) => (
                    <button
                      key={classKey}
                      onClick={() => setSelectedClass(classKey)}
                      className={`w-full text-left p-4 border rounded-lg transition-all ${
                        selectedClass === classKey
                          ? 'border-[#0E76BC] bg-blue-50 ring-2 ring-[#0E76BC]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold capitalize text-gray-900">
                          {classKey.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {classData.price === 0 ? 'Included' : `+$${classData.price}`}
                          </p>
                          <p className="text-xs text-gray-500">{classData.available} seats left</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {classData.features.slice(0, 2).map((feature, index) => (
                          <span key={index}>
                            {feature}
                            {index < classData.features.slice(0, 2).length - 1 ? ' • ' : ''}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-6 border-b border-gray-200">
                <button
                  onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h3 className="text-lg font-semibold">Price Breakdown</h3>
                  {showPriceBreakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {showPriceBreakdown && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Base Fare</span>
                      <span>${flightDetails.price.base}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & Fees</span>
                      <span>${flightDetails.price.taxes + flightDetails.price.fees}</span>
                    </div>
                    {seatMap[selectedClass].price > 0 && (
                      <div className="flex justify-between">
                        <span>Class Upgrade</span>
                        <span>+${seatMap[selectedClass].price}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${totalPrice}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Book Button */}
              <div className="p-6">
                <button className="w-full bg-gradient-to-r from-[#0E76BC] to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-[#0E76BC] hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Book Now - ${totalPrice}</span>
                </button>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Free cancellation within 24 hours
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Price lock guarantee for 24 hours
                  </p>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="px-6 pb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Shield className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold text-green-800">Secure Booking</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your payment information is protected with 256-bit SSL encryption
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[#0E76BC]" />
              Important Times
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Check-in opens:</span>
                <span className="font-medium">24 hours before</span>
              </div>
              <div className="flex justify-between">
                <span>Check-in closes:</span>
                <span className="font-medium">1 hour before</span>
              </div>
              <div className="flex justify-between">
                <span>Boarding begins:</span>
                <span className="font-medium">45 minutes before</span>
              </div>
              <div className="flex justify-between">
                <span>Gate closes:</span>
                <span className="font-medium">15 minutes before</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-[#0E76BC]" />
              Airport Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm">Departure</p>
                <p className="text-sm text-gray-600">{flightDetails.from.name}</p>
                <p className="text-sm text-gray-600">{flightDetails.from.terminal}</p>
              </div>
              <div>
                <p className="font-medium text-sm">Arrival</p>
                <p className="text-sm text-gray-600">{flightDetails.to.name}</p>
                <p className="text-sm text-gray-600">{flightDetails.to.terminal}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2 lg:col-span-1">
            <h3 className="font-semibold mb-3 flex items-center">
              <Star className="w-5 h-5 mr-2 text-[#0E76BC]" />
              Why Choose {flightDetails.airline}?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-[#0E76BC] rounded-full mr-3"></div>
                Award-winning service
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-[#0E76BC] rounded-full mr-3"></div>
                Modern fleet with latest amenities
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-[#0E76BC] rounded-full mr-3"></div>
                On-time performance: 87%
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-[#0E76BC] rounded-full mr-3"></div>
                24/7 customer support
              </li>
            </ul>
          </div>
        </div>

        {/* Similar Flights */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Similar Flights</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { airline: 'British Airways', time: '21:30 - 08:45+1', price: 899, duration: '7h 15m' },
                  { airline: 'Virgin Atlantic', time: '10:15 - 21:30', price: 1150, duration: '7h 15m' }
                ].map((flight, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{flight.airline}</h4>
                      <span className="text-lg font-bold text-[#0E76BC]">${flight.price}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{flight.time}</span>
                      <span>{flight.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default FlightDetails;
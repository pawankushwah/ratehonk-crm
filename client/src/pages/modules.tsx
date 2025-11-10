import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  ShoppingCart, 
  Stethoscope, 
  GraduationCap, 
  Building, 
  Factory,
  Car,
  Coffee,
  Utensils,
  Home,
  ArrowRight,
  Star,
  Zap,
  Settings,
  Users,
  Plus,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { RateHonkLogo } from "@/components/ui/ratehonk-logo";
import Logo from "../assets/Logo-sidebar.svg"

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'crm' | 'erp' | 'specialized';
  status: 'active' | 'coming-soon' | 'beta';
  features: string[];
  color: string;
}

const modules: Module[] = [
  // CRM Modules
  {
    id: 'travel-crm',
    name: 'Travel CRM',
    description: 'Complete travel agency management with bookings, packages, and customer relationships',
    icon: <Plane className="w-8 h-8" />,
    category: 'crm',
    status: 'active',
    features: ['Customer Management', 'Booking System', 'Package Creation', 'Lead Tracking', 'Gmail Integration'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'retail-crm',
    name: 'Retail CRM',
    description: 'Manage retail operations, inventory, and customer relationships',
    icon: <ShoppingCart className="w-8 h-8" />,
    category: 'crm',
    status: 'coming-soon',
    features: ['Inventory Management', 'POS Integration', 'Customer Loyalty', 'Sales Analytics'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'healthcare-crm',
    name: 'Healthcare CRM',
    description: 'Patient management, appointments, and healthcare operations',
    icon: <Stethoscope className="w-8 h-8" />,
    category: 'crm',
    status: 'coming-soon',
    features: ['Patient Records', 'Appointment Scheduling', 'Medical History', 'Insurance Management'],
    color: 'from-red-500 to-pink-500'
  },
  {
    id: 'education-crm',
    name: 'Education CRM',
    description: 'Student information system and educational institution management',
    icon: <GraduationCap className="w-8 h-8" />,
    category: 'crm',
    status: 'beta',
    features: ['Student Enrollment', 'Course Management', 'Fee Tracking', 'Performance Analytics'],
    color: 'from-purple-500 to-violet-500'
  },

  // ERP Modules
  {
    id: 'real-estate-erp',
    name: 'Real Estate ERP',
    description: 'Property management, sales, and real estate operations',
    icon: <Building className="w-8 h-8" />,
    category: 'erp',
    status: 'coming-soon',
    features: ['Property Listings', 'Client Management', 'Transaction Tracking', 'Document Management'],
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'manufacturing-erp',
    name: 'Manufacturing ERP',
    description: 'Complete manufacturing and production management system',
    icon: <Factory className="w-8 h-8" />,
    category: 'erp',
    status: 'coming-soon',
    features: ['Production Planning', 'Quality Control', 'Supply Chain', 'Resource Management'],
    color: 'from-gray-600 to-gray-800'
  },
  {
    id: 'automotive-erp',
    name: 'Automotive ERP',
    description: 'Vehicle dealership and automotive service management',
    icon: <Car className="w-8 h-8" />,
    category: 'erp',
    status: 'coming-soon',
    features: ['Vehicle Inventory', 'Service Management', 'Parts Tracking', 'Customer Service'],
    color: 'from-blue-600 to-indigo-600'
  },

  // Specialized Modules
  {
    id: 'hospitality-suite',
    name: 'Hospitality Suite',
    description: 'Hotel, restaurant, and hospitality business management',
    icon: <Coffee className="w-8 h-8" />,
    category: 'specialized',
    status: 'coming-soon',
    features: ['Reservation System', 'Room Management', 'Guest Services', 'Staff Scheduling'],
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'restaurant-pos',
    name: 'Restaurant POS',
    description: 'Point of sale and restaurant management system',
    icon: <Utensils className="w-8 h-8" />,
    category: 'specialized',
    status: 'beta',
    features: ['Order Management', 'Kitchen Display', 'Table Management', 'Menu Planning'],
    color: 'from-yellow-500 to-amber-500'
  }
];

export default function Modules() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'crm' | 'erp' | 'specialized'>('all');
  const [showTour, setShowTour] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is first time and show tour
    const isFirstTime = localStorage.getItem('dashboard_tour_shown') !== 'true';
    if (isFirstTime) {
      setShowTour(true);
    }
  }, []);

  const handleModuleAccess = (moduleId: string) => {
    if (moduleId === 'travel-crm') {
      // Mark tour as shown
      localStorage.setItem('dashboard_tour_shown', 'true');
      setLocation("/dashboard");
    } else {
      // For other modules, show coming soon message or redirect to waiting list
      console.log(`Module ${moduleId} is not yet available`);
    }
  };

  const filteredModules = selectedCategory === 'all' 
    ? modules 
    : modules.filter(module => module.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All Modules', count: modules.length },
    { id: 'crm', name: 'CRM Systems', count: modules.filter(m => m.category === 'crm').length },
    { id: 'erp', name: 'ERP Solutions', count: modules.filter(m => m.category === 'erp').length },
    { id: 'specialized', name: 'Specialized', count: modules.filter(m => m.category === 'specialized').length },
  ];

  // Tour Modal Component
  const TourModal = () => (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${showTour ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Welcome Tour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Welcome to your RateHonk dashboard! This is where you can access all available business modules.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Travel CRM is ready to use</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>More modules coming soon</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4 text-gray-500" />
              <span>Customize your workspace</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTour(false);
                localStorage.setItem('dashboard_tour_shown', 'true');
              }}
              className="flex-1"
            >
              Skip Tour
            </Button>
            <Button 
              onClick={() => {
                setShowTour(false);
                localStorage.setItem('dashboard_tour_shown', 'true');
                handleModuleAccess('travel-crm');
              }}
              className="flex-1"
            >
              Start with Travel CRM
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Tour Modal */}
      <TourModal />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center mb-6">
            {/* <RateHonkLogo height="80px" /> */}
             <img
                  src={Logo}
                  alt="Logo"
                  className="w-[200px] h-[80px] object-contain center mx-auto"
                />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Modules</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, <span className="font-semibold">{user?.firstName}</span>! 
                Choose a module to manage your business operations.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Account Settings
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Request Module
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-4 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id as any)}
              className="flex items-center gap-2"
            >
              {category.name}
              <Badge variant="secondary" className="ml-1">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <Card 
              key={module.id} 
              className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-0 shadow-lg ${
                module.status === 'active' ? 'ring-2 ring-green-200' : ''
              }`}
              onClick={() => handleModuleAccess(module.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color} text-white`}>
                    {module.icon}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant={
                        module.status === 'active' ? 'default' : 
                        module.status === 'beta' ? 'secondary' : 'outline'
                      }
                      className={
                        module.status === 'active' ? 'bg-green-500 text-white' :
                        module.status === 'beta' ? 'bg-yellow-500 text-white' : ''
                      }
                    >
                      {module.status === 'active' ? 'Available' : 
                       module.status === 'beta' ? 'Beta' : 'Coming Soon'}
                    </Badge>
                    {module.status === 'active' && (
                      <Star className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                </div>
                
                <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                  {module.name}
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  {module.description}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Features:</h4>
                    <div className="space-y-1">
                      {module.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                      {module.features.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{module.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full group-hover:bg-purple-600 transition-colors"
                    disabled={module.status === 'coming-soon'}
                  >
                    {module.status === 'active' ? 'Access Module' :
                     module.status === 'beta' ? 'Try Beta' : 'Join Waitlist'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredModules.length === 0 && (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-600">Try selecting a different category or check back later.</p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">🚀 Expanding Our Platform</h3>
          <p className="text-gray-600 mb-4">
            We're constantly adding new modules to serve different industries. 
            Have a specific business need? Let us know what module you'd like to see next!
          </p>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Request Custom Module
          </Button>
        </div>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useState } from 'react';

interface RevenueChartProps {
  data?: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

export function RevenueChart({ data = [] }: RevenueChartProps) {
  const [activeView, setActiveView] = useState<'revenue' | 'bookings'>('revenue');

  if (!data.length) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Overview</CardTitle>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant={activeView === 'revenue' ? 'default' : 'outline'}
                onClick={() => setActiveView('revenue')}
              >
                Revenue
              </Button>
              <Button 
                size="sm" 
                variant={activeView === 'bookings' ? 'default' : 'outline'}
                onClick={() => setActiveView('bookings')}
              >
                Bookings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No revenue data available</p>
              <p className="text-sm text-gray-400 mt-1">Start adding bookings to see analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const maxBookings = Math.max(...data.map(d => d.bookings));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {activeView === 'revenue' ? 'Revenue Overview' : 'Bookings Overview'}
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant={activeView === 'revenue' ? 'default' : 'outline'}
              onClick={() => setActiveView('revenue')}
            >
              Revenue
            </Button>
            <Button 
              size="sm" 
              variant={activeView === 'bookings' ? 'default' : 'outline'}
              onClick={() => setActiveView('bookings')}
            >
              Bookings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {activeView === 'revenue' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  className="text-sm text-gray-600"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-sm text-gray-600"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  labelClassName="text-gray-900"
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  className="text-sm text-gray-600"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-sm text-gray-600"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}`, 'Bookings']}
                  labelClassName="text-gray-900"
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="bookings" 
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Revenue (6 months)</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Bookings (6 months)</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {data.reduce((sum, d) => sum + d.bookings, 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

// Farm Owner Epidemiological Conditions Component
export function EpidemiologicalConditions() {
  // Mock environmental data
  const temperatureData = [
    { day: 'Mon', temp: 28, avgTemp: 25 },
    { day: 'Tue', temp: 30, avgTemp: 26 },
    { day: 'Wed', temp: 32, avgTemp: 27 },
    { day: 'Thu', temp: 29, avgTemp: 26 },
    { day: 'Fri', temp: 27, avgTemp: 25 },
    { day: 'Sat', temp: 31, avgTemp: 28 },
    { day: 'Sun', temp: 33, avgTemp: 29 }
  ];

  const rainfallData = [
    { month: 'Dec', rainfall: 15 },
    { month: 'Jan', rainfall: 8 },
    { month: 'Feb', rainfall: 12 },
    { month: 'Mar', rainfall: 25 }
  ];

  const currentConditions = {
    temperature: 30,
    humidity: 68,
    windSpeed: 12,
    rainfall: 8,
    season: 'Winter'
  };

  const riskAssessment = {
    level: 'Medium',
    factors: [
      { factor: 'High Humidity', impact: 'Increases respiratory disease risk', risk: 'high' },
      { factor: 'Moderate Temperature', impact: 'Optimal for livestock health', risk: 'low' },
      { factor: 'Low Rainfall', impact: 'Reduces vector breeding sites', risk: 'low' },
      { factor: 'Winter Season', impact: 'Lower viral transmission rates', risk: 'low' }
    ]
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Cloud className="w-5 h-5" />
          Epidemiological Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Weather Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Thermometer className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Temperature</p>
              <p className="text-lg font-bold text-blue-800">{currentConditions.temperature}°C</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
            <Droplets className="w-8 h-8 text-cyan-600" />
            <div>
              <p className="text-xs text-gray-600">Humidity</p>
              <p className="text-lg font-bold text-cyan-800">{currentConditions.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Wind className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Wind Speed</p>
              <p className="text-lg font-bold text-green-800">{currentConditions.windSpeed} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
            <Cloud className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="text-xs text-gray-600">Rainfall</p>
              <p className="text-lg font-bold text-indigo-800">{currentConditions.rainfall} mm</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Trend */}
          <div>
            <h5 className="font-medium mb-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-blue-600" />
              Temperature Trend (7 Days)
            </h5>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="temp" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="avgTemp" stroke="#64748b" fill="#94a3b8" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rainfall Pattern */}
          <div>
            <h5 className="font-medium mb-3 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-600" />
              Rainfall Pattern (4 Months)
            </h5>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rainfallData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rainfall" fill="#0891b2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Risk Assessment Note */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
          <h5 className="font-medium mb-3 text-blue-900">Environmental Risk Assessment</h5>
          <div className="space-y-2">
            {riskAssessment.factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{factor.factor}:</span>
                  <span className="text-gray-600 ml-2">{factor.impact}</span>
                </div>
                <Badge className={`text-xs ${getRiskColor(factor.risk)}`}>
                  {factor.risk.charAt(0).toUpperCase() + factor.risk.slice(1)} Risk
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Current Assessment:</strong> Environmental conditions show moderate disease transmission risk. 
              High humidity levels require increased ventilation monitoring. Low rainfall reduces vector breeding, 
              while winter temperatures help limit viral spread. Maintain enhanced biosecurity protocols during humid periods.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
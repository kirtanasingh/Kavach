import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Cloud,
  Droplets,
  Thermometer,
  Wind,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Government/Authority Epidemiological Conditions Overview Component
export function EpidemiologicalConditionsOverview() {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('temperature');
  const [dateRange, setDateRange] = useState('last30days');

  // Mock environmental data across regions
  const regionalData = [
    { region: 'North', temp: 28, humidity: 65, rainfall: 12, diseaseRisk: 'Medium' },
    { region: 'South', temp: 32, humidity: 78, rainfall: 45, diseaseRisk: 'High' },
    { region: 'East', temp: 30, humidity: 82, rainfall: 65, diseaseRisk: 'High' },
    { region: 'West', temp: 25, humidity: 45, rainfall: 8, diseaseRisk: 'Low' },
    { region: 'Central', temp: 29, humidity: 60, rainfall: 25, diseaseRisk: 'Medium' }
  ];

  const seasonalDiseaseData = [
    { month: 'Oct', temperature: 26, diseaseIncidence: 15, rainfall: 20 },
    { month: 'Nov', temperature: 24, diseaseIncidence: 12, rainfall: 15 },
    { month: 'Dec', temperature: 22, diseaseIncidence: 8, rainfall: 10 },
    { month: 'Jan', temperature: 20, diseaseIncidence: 6, rainfall: 5 },
    { month: 'Feb', temperature: 23, diseaseIncidence: 9, rainfall: 8 },
    { month: 'Mar', temperature: 28, diseaseIncidence: 18, rainfall: 25 }
  ];

  const climateMapData = [
    { state: 'Rajasthan', temp: 25, humidity: 42, rainfall: 5, risk: 'Low' },
    { state: 'Kerala', temp: 30, humidity: 85, rainfall: 78, risk: 'High' },
    { state: 'Punjab', temp: 22, humidity: 55, rainfall: 15, risk: 'Medium' },
    { state: 'Maharashtra', temp: 28, humidity: 68, rainfall: 35, risk: 'Medium' },
    { state: 'West Bengal', temp: 29, humidity: 82, rainfall: 85, risk: 'High' },
    { state: 'Gujarat', temp: 27, humidity: 50, rainfall: 12, risk: 'Low' }
  ];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Cloud className="w-5 h-5" />
            Epidemiological Conditions Overview
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
                <SelectItem value="central">Central</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="humidity">Humidity</SelectItem>
                <SelectItem value="rainfall">Rainfall</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Regional Environmental Summary */}
        <div>
          <h5 className="font-medium mb-3">Regional Climate Summary</h5>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {regionalData.map((region) => (
              <div key={region.region} className="p-3 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{region.region}</span>
                  <div className={`w-3 h-3 rounded-full ${getRiskColor(region.diseaseRisk)}`}></div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-3 h-3 text-red-500" />
                    <span>{region.temp}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>{region.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-3 h-3 text-gray-500" />
                    <span>{region.rainfall}mm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seasonal Disease Pattern Chart */}
          <div>
            <h5 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Seasonal Disease Patterns vs Climate
            </h5>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={seasonalDiseaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="diseaseIncidence" fill="#ef4444" fillOpacity={0.3} />
                  <Line type="monotone" dataKey="temperature" stroke="#2563eb" strokeWidth={2} />
                  <Area type="monotone" dataKey="rainfall" fill="#06b6d4" fillOpacity={0.6} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Climate Risk Map */}
          <div>
            <h5 className="font-medium mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              State-wise Climate Risk Mapping
            </h5>
            <div className="grid grid-cols-2 gap-2 h-48 overflow-y-auto">
              {climateMapData.map((state) => (
                <div key={state.state} className="p-2 border rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{state.state}</span>
                    <div className={`w-2 h-2 rounded-full ${getRiskColor(state.risk)}`}></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Temp:</span>
                      <span>{state.temp}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Humidity:</span>
                      <span>{state.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rain:</span>
                      <span>{state.rainfall}mm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Assessment Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-yellow-50 p-4 rounded-lg border border-blue-200">
          <h5 className="font-medium mb-3 text-blue-900">National Environmental Risk Assessment</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-blue-800">High Risk Regions</div>
              <ul className="space-y-1 text-blue-700">
                <li>• Southern states - High humidity (>75%)</li>
                <li>• Eastern regions - Heavy rainfall (>60mm)</li>
                <li>• Coastal areas - Combined heat & moisture</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-blue-800">Current Threats</div>
              <ul className="space-y-1 text-blue-700">
                <li>• Respiratory diseases in humid zones</li>
                <li>• Vector-borne diseases in rainy areas</li>
                <li>• Heat stress in high temperature regions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-blue-800">Recommendations</div>
              <ul className="space-y-1 text-blue-700">
                <li>• Enhanced ventilation in South/East</li>
                <li>• Vector control in wet seasons</li>
                <li>• Heat mitigation in hot zones</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Alert:</strong> Monsoon season approaching in 6 weeks. Prepare enhanced surveillance 
              protocols for vector-borne diseases in high-risk eastern and southern regions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  ArrowLeft, Search, Filter, Calendar, Download, FileText, TrendingUp, 
  TrendingDown, AlertTriangle, CheckCircle, BarChart3, PieChart, MapPin,
  Clock, Users, Activity, Zap, Eye, Bell, Target, Award, LineChart
} from "lucide-react";
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, 
  ComposedChart, Area, Scatter, ScatterChart,
  RadialBarChart, RadialBar, Legend
} from "recharts";

interface TrendAnalyticsProps {
  onNavigate: (screen: string) => void;
  userName: string;
  userRole: 'Farm Owner' | 'Veterinarian' | 'Authority';
}

// Mock trend data
const mockTrendData = {
  amuOverTime: [
    { month: 'Jan', amuCount: 245, compliance: 92, avgWithdrawal: 7.2, violations: 8 },
    { month: 'Feb', amuCount: 298, compliance: 89, avgWithdrawal: 7.8, violations: 12 },
    { month: 'Mar', amuCount: 334, compliance: 91, avgWithdrawal: 7.5, violations: 10 },
    { month: 'Apr', amuCount: 287, compliance: 94, avgWithdrawal: 6.9, violations: 6 },
    { month: 'May', amuCount: 356, compliance: 88, avgWithdrawal: 8.1, violations: 15 },
    { month: 'Jun', amuCount: 312, compliance: 93, avgWithdrawal: 7.3, violations: 9 },
    { month: 'Jul', amuCount: 289, compliance: 95, avgWithdrawal: 6.8, violations: 5 },
    { month: 'Aug', amuCount: 401, compliance: 87, avgWithdrawal: 8.4, violations: 18 },
    { month: 'Sep', amuCount: 378, compliance: 90, avgWithdrawal: 7.6, violations: 11 },
    { month: 'Oct', amuCount: 423, compliance: 85, avgWithdrawal: 8.9, violations: 21 },
    { month: 'Nov', amuCount: 365, compliance: 92, avgWithdrawal: 7.4, violations: 8 },
    { month: 'Dec', amuCount: 298, compliance: 96, avgWithdrawal: 6.5, violations: 4 }
  ],
  drugUsage: [
    { name: 'Amoxicillin', value: 156, percentage: 28.5, trend: 'up', color: '#8fb569' },
    { name: 'Oxytetracycline', value: 134, percentage: 24.4, trend: 'down', color: '#f4a261' },
    { name: 'Penicillin G', value: 89, percentage: 16.2, trend: 'stable', color: '#e9b893' },
    { name: 'Enrofloxacin', value: 76, percentage: 13.8, trend: 'up', color: '#6b8e65' },
    { name: 'Florfenicol', value: 54, percentage: 9.8, trend: 'down', color: '#d89b47' },
    { name: 'Others', value: 40, percentage: 7.3, trend: 'stable', color: '#94a3b8' }
  ],
  speciesUsage: [
    { 
      species: 'Cattle', 
      amoxicillin: 85, 
      oxytetracycline: 62, 
      penicillin: 48, 
      enrofloxacin: 23, 
      other: 31,
      total: 249,
      compliance: 94
    },
    { 
      species: 'Pigs', 
      amoxicillin: 45, 
      oxytetracycline: 58, 
      penicillin: 28, 
      enrofloxacin: 34, 
      other: 28,
      total: 193,
      compliance: 87
    },
    { 
      species: 'Poultry', 
      amoxicillin: 26, 
      oxytetracycline: 14, 
      penicillin: 13, 
      enrofloxacin: 19, 
      other: 15,
      total: 87,
      compliance: 91
    },
    { 
      species: 'Goats', 
      amoxicillin: 18, 
      oxytetracycline: 12, 
      penicillin: 8, 
      enrofloxacin: 6, 
      other: 8,
      total: 52,
      compliance: 96
    }
  ],
  regionalCompliance: [
    { region: 'North', farms: 45, compliance: 94, violations: 12, amuCount: 234, riskLevel: 'Low' },
    { region: 'South', farms: 62, compliance: 89, violations: 28, amuCount: 356, riskLevel: 'Medium' },
    { region: 'East', farms: 38, compliance: 92, violations: 15, amuCount: 198, riskLevel: 'Low' },
    { region: 'West', farms: 51, compliance: 87, violations: 31, amuCount: 289, riskLevel: 'High' },
    { region: 'Central', farms: 29, compliance: 96, violations: 6, amuCount: 167, riskLevel: 'Low' }
  ],
  complianceHeatmap: [
    { region: 'North', month: 'Jan', compliance: 94, violations: 2 },
    { region: 'North', month: 'Feb', compliance: 91, violations: 4 },
    { region: 'North', month: 'Mar', compliance: 96, violations: 1 },
    { region: 'South', month: 'Jan', compliance: 87, violations: 8 },
    { region: 'South', month: 'Feb', compliance: 89, violations: 7 },
    { region: 'South', month: 'Mar', compliance: 85, violations: 9 },
    { region: 'East', month: 'Jan', compliance: 93, violations: 3 },
    { region: 'East', month: 'Feb', compliance: 94, violations: 2 },
    { region: 'East', month: 'Mar', compliance: 90, violations: 5 },
    { region: 'West', month: 'Jan', compliance: 85, violations: 9 },
    { region: 'West', month: 'Feb', compliance: 88, violations: 7 },
    { region: 'West', month: 'Mar', compliance: 86, violations: 8 },
    { region: 'Central', month: 'Jan', compliance: 97, violations: 1 },
    { region: 'Central', month: 'Feb', compliance: 95, violations: 2 },
    { region: 'Central', month: 'Mar', compliance: 98, violations: 0 }
  ],
  alertPatterns: [
    {
      id: 1,
      pattern: "Recurring Oxytetracycline violations in West region",
      frequency: "Weekly",
      severity: "High",
      affectedFarms: 8,
      description: "Same 8 farms repeatedly violating withdrawal periods for Oxytetracycline",
      recommendation: "Targeted training program for affected farms",
      firstDetected: "2024-10-15",
      lastOccurrence: "2024-12-20"
    },
    {
      id: 2,
      pattern: "Seasonal spike in AMU during monsoon",
      frequency: "Annual",
      severity: "Medium",
      affectedFarms: 35,
      description: "40% increase in antimicrobial usage during June-August across all regions",
      recommendation: "Preventive care protocols for monsoon season",
      firstDetected: "2023-06-01",
      lastOccurrence: "2024-08-31"
    },
    {
      id: 3,
      pattern: "Non-compliance clusters in South region poultry farms",
      frequency: "Monthly",
      severity: "High",
      affectedFarms: 12,
      description: "Consistent violation patterns in 12 poultry farms showing 60% non-compliance",
      recommendation: "Enhanced supervision and immediate intervention required",
      firstDetected: "2024-09-01",
      lastOccurrence: "2024-12-18"
    }
  ]
};

export function TrendAnalytics({ onNavigate, userName, userRole }: TrendAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("12months");
  const [selectedSpecies, setSelectedSpecies] = useState("all");
  const [selectedDrug, setSelectedDrug] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  // Calculate current month statistics
  const currentStats = useMemo(() => {
    const currentMonth = mockTrendData.amuOverTime[mockTrendData.amuOverTime.length - 1];
    const previousMonth = mockTrendData.amuOverTime[mockTrendData.amuOverTime.length - 2];
    
    return {
      totalAMU: currentMonth.amuCount,
      amuChange: ((currentMonth.amuCount - previousMonth.amuCount) / previousMonth.amuCount * 100).toFixed(1),
      compliance: currentMonth.compliance,
      complianceChange: (currentMonth.compliance - previousMonth.compliance).toFixed(1),
      avgWithdrawal: currentMonth.avgWithdrawal,
      withdrawalChange: ((currentMonth.avgWithdrawal - previousMonth.avgWithdrawal) / previousMonth.avgWithdrawal * 100).toFixed(1),
      violations: currentMonth.violations,
      violationChange: ((currentMonth.violations - previousMonth.violations) / previousMonth.violations * 100).toFixed(1)
    };
  }, []);

  const getDashboardRoute = () => {
    switch (userRole) {
      case 'Authority': return 'authority-dashboard';
      case 'Veterinarian': return 'vet-dashboard';
      case 'Farm Owner': return 'farm-owner-dashboard';
      default: return 'home';
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return 'bg-green-500';
    if (compliance >= 90) return 'bg-yellow-500';
    if (compliance >= 85) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-600" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-600" />;
    }
  };

  const getChangeColor = (value: string) => {
    const num = parseFloat(value);
    if (num > 0) return 'text-red-600';
    if (num < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
              {entry.dataKey === 'compliance' && '%'}
              {entry.dataKey === 'avgWithdrawal' && ' days'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-25 to-green-25">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate(getDashboardRoute())}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: '#006400' }}>AMU Trends & Insights</h1>
              <p className="text-sm font-bold" style={{ color: '#EA580C' }}>Advanced Analytics for Antimicrobial Usage Patterns</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="w-3 h-3 mr-1" />
              {userRole}
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total AMU Logs</p>
                  <p className="text-2xl font-bold text-primary">{currentStats.totalAMU}</p>
                  <p className={`text-xs ${getChangeColor(currentStats.amuChange)}`}>
                    {currentStats.amuChange > 0 ? '+' : ''}{currentStats.amuChange}% vs last month
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Compliance</p>
                  <p className="text-2xl font-bold text-green-600">{currentStats.compliance}%</p>
                  <p className={`text-xs ${getChangeColor(currentStats.complianceChange)}`}>
                    {currentStats.complianceChange > 0 ? '+' : ''}{currentStats.complianceChange}% vs last month
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Withdrawal Days</p>
                  <p className="text-2xl font-bold text-yellow-600">{currentStats.avgWithdrawal}</p>
                  <p className={`text-xs ${getChangeColor(currentStats.withdrawalChange)}`}>
                    {currentStats.withdrawalChange > 0 ? '+' : ''}{currentStats.withdrawalChange}% vs last month
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Non-compliant Incidents</p>
                  <p className="text-2xl font-bold text-red-600">{currentStats.violations}</p>
                  <p className={`text-xs ${getChangeColor(currentStats.violationChange)}`}>
                    {currentStats.violationChange > 0 ? '+' : ''}{currentStats.violationChange}% vs last month
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search drugs, farms, regions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                  <SelectItem value="2years">Last 2 Years</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                <SelectTrigger>
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="cattle">Cattle</SelectItem>
                  <SelectItem value="pigs">Pigs</SelectItem>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="goats">Goats</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                <SelectTrigger>
                  <SelectValue placeholder="Drug" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drugs</SelectItem>
                  <SelectItem value="amoxicillin">Amoxicillin</SelectItem>
                  <SelectItem value="oxytetracycline">Oxytetracycline</SelectItem>
                  <SelectItem value="penicillin">Penicillin G</SelectItem>
                  <SelectItem value="enrofloxacin">Enrofloxacin</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Tabs */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Usage Trends</TabsTrigger>
            <TabsTrigger value="drugs">Drug Analysis</TabsTrigger>
            <TabsTrigger value="regional">Regional Insights</TabsTrigger>
            <TabsTrigger value="alerts">Alert Patterns</TabsTrigger>
          </TabsList>

          {/* Usage Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AMU Over Time */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Antimicrobial Usage Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mockTrendData.amuOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar yAxisId="left" dataKey="amuCount" fill="#8fb569" name="AMU Count" />
                        <Line yAxisId="right" type="monotone" dataKey="compliance" stroke="#f4a261" strokeWidth={3} name="Compliance %" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Species Distribution */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Usage by Species
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockTrendData.speciesUsage} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="species" type="category" />
                        <Tooltip />
                        <Bar dataKey="amoxicillin" stackId="a" fill="#8fb569" />
                        <Bar dataKey="oxytetracycline" stackId="a" fill="#f4a261" />
                        <Bar dataKey="penicillin" stackId="a" fill="#e9b893" />
                        <Bar dataKey="enrofloxacin" stackId="a" fill="#6b8e65" />
                        <Bar dataKey="other" stackId="a" fill="#94a3b8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Withdrawal Period Analysis */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Withdrawal Period Trends & Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mockTrendData.amuOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area yAxisId="left" type="monotone" dataKey="avgWithdrawal" fill="#eab308" fillOpacity={0.3} stroke="#eab308" name="Avg Withdrawal Days" />
                      <Bar yAxisId="right" dataKey="violations" fill="#ef4444" name="Violations" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drug Analysis Tab */}
          <TabsContent value="drugs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Used Drugs */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-600" />
                    Most Frequently Used Drugs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={mockTrendData.drugUsage}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percentage}) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {mockTrendData.drugUsage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Drug Usage Details */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Drug Usage Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockTrendData.drugUsage.map((drug, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: drug.color }}></div>
                        <div>
                          <p className="font-medium">{drug.name}</p>
                          <p className="text-sm text-gray-600">{drug.value} uses ({drug.percentage}%)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(drug.trend)}
                        <span className="text-sm font-medium capitalize">{drug.trend}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Regional Insights Tab */}
          <TabsContent value="regional" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regional Compliance */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Region-wise Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockTrendData.regionalCompliance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="region" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="compliance" fill="#8fb569" name="Compliance %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Regional Risk Assessment */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Regional Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockTrendData.regionalCompliance.map((region, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getComplianceColor(region.compliance)}`}></div>
                        <div>
                          <p className="font-medium">{region.region} Region</p>
                          <p className="text-sm text-gray-600">{region.farms} farms • {region.compliance}% compliant</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={region.riskLevel === 'High' ? 'destructive' : region.riskLevel === 'Medium' ? 'secondary' : 'default'}>
                          {region.riskLevel} Risk
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">{region.violations} violations</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Compliance Heatmap */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Regional Compliance Heatmap (Last 3 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-1">
                  <div className="p-2 font-medium text-center bg-gray-100">Region</div>
                  <div className="p-2 font-medium text-center bg-gray-100">Jan</div>
                  <div className="p-2 font-medium text-center bg-gray-100">Feb</div>
                  <div className="p-2 font-medium text-center bg-gray-100">Mar</div>
                  
                  {['North', 'South', 'East', 'West', 'Central'].map(region => (
                    <div key={region} className="contents">
                      <div className="p-2 font-medium">{region}</div>
                      {['Jan', 'Feb', 'Mar'].map(month => {
                        const data = mockTrendData.complianceHeatmap.find(d => d.region === region && d.month === month);
                        return (
                          <div key={`${region}-${month}`} className="p-2 text-center relative">
                            <div 
                              className={`w-full h-8 rounded flex items-center justify-center text-white text-sm font-medium ${getComplianceColor(data?.compliance || 0)}`}
                            >
                              {data?.compliance}%
                            </div>
                            {data && data.violations > 0 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                                {data.violations}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alert Patterns Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-600" />
                  Recurring Non-Compliance Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockTrendData.alertPatterns.map((alert, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={alert.severity === 'High' ? 'destructive' : 'secondary'}>
                            {alert.severity} Severity
                          </Badge>
                          <Badge variant="outline">
                            {alert.frequency}
                          </Badge>
                          <span className="text-sm text-gray-600">{alert.affectedFarms} farms affected</span>
                        </div>
                        <h4 className="font-medium text-lg mb-2">{alert.pattern}</h4>
                        <p className="text-gray-600 mb-3">{alert.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">First Detected:</span> {new Date(alert.firstDetected).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Last Occurrence:</span> {new Date(alert.lastOccurrence).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAlert(alert)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-1">Recommended Action:</p>
                      <p className="text-sm text-blue-700">{alert.recommendation}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Alert Details Dialog */}
      <Dialog open={selectedAlert !== null} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Alert Pattern Details
            </DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Pattern Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Pattern:</strong> {selectedAlert.pattern}</p>
                    <p><strong>Frequency:</strong> {selectedAlert.frequency}</p>
                    <p><strong>Severity:</strong> {selectedAlert.severity}</p>
                    <p><strong>Affected Farms:</strong> {selectedAlert.affectedFarms}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>First Detected:</strong> {new Date(selectedAlert.firstDetected).toLocaleDateString()}</p>
                    <p><strong>Last Occurrence:</strong> {new Date(selectedAlert.lastOccurrence).toLocaleDateString()}</p>
                    <p><strong>Duration:</strong> {Math.ceil((new Date(selectedAlert.lastOccurrence).getTime() - new Date(selectedAlert.firstDetected).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600 text-sm">{selectedAlert.description}</p>
              </div>

              <div className="bg-amber-50 p-4 rounded border border-amber-200">
                <h4 className="font-medium mb-2 text-amber-800">Recommended Action</h4>
                <p className="text-amber-700 text-sm">{selectedAlert.recommendation}</p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                  Close
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  Create Action Plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
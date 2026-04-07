import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { ArrowLeft, Search, Filter, Calendar, CheckCircle, AlertTriangle, XCircle, BarChart3, Users, Building, TrendingDown, Eye, AlertCircle, Clock, ShieldCheck, Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ComplianceRecord {
  id: string;
  animalId: string;
  animalType: 'cattle' | 'pig' | 'poultry';
  farmName: string;
  farmId: string;
  drugUsed: string;
  dateAdministered: string;
  withdrawalPeriod: number;
  safeDate: string;
  complianceStatus: 'compliant' | 'in_withdrawal' | 'non_compliant';
  collectionStatus: 'safe' | 'unsafe' | 'pending';
  vetName: string;
  productType: 'milk' | 'eggs' | 'meat';
  daysRemaining: number;
  notes?: string;
  region?: string;
}

interface FarmSummary {
  farmId: string;
  farmName: string;
  region: string;
  totalAnimals: number;
  compliantCount: number;
  nonCompliantCount: number;
  complianceRate: number;
  lastInspection: string;
}

interface ComplianceDashboardProps {
  onNavigate: (screen: string) => void;
  userName: string;
  userRole: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority';
}

// Mock compliance data
const mockComplianceData: ComplianceRecord[] = [
  {
    id: "C001",
    animalId: "COW-A123",
    animalType: "cattle",
    farmName: "Green Valley Livestock Farm",
    farmId: "FARM-001",
    drugUsed: "Amoxicillin",
    dateAdministered: "2024-01-10",
    withdrawalPeriod: 7,
    safeDate: "2024-01-17",
    complianceStatus: "compliant",
    collectionStatus: "safe",
    vetName: "Dr. Arjun Patel",
    productType: "milk",
    daysRemaining: 0
  },
  {
    id: "C002",
    animalId: "PIG-B456",
    animalType: "pig",
    farmName: "Sunrise Pig Farm",
    farmId: "FARM-002",
    drugUsed: "Porcine Circovirus Vaccine (PCV2)",
    dateAdministered: "2024-01-12",
    withdrawalPeriod: 0,
    safeDate: "2024-01-26",
    complianceStatus: "in_withdrawal",
    collectionStatus: "pending",
    vetName: "Dr. Priya Sharma",
    productType: "meat",
    daysRemaining: 5,
    region: "North District"
  },
  {
    id: "C003",
    animalId: "HEN-C789",
    animalType: "poultry",
    farmName: "Golden Poultry Farm",
    farmId: "FARM-003",
    drugUsed: "Fowl Pox Vaccine",
    dateAdministered: "2024-01-14",
    withdrawalPeriod: 0,
    safeDate: "2024-01-14",
    complianceStatus: "compliant",
    collectionStatus: "safe",
    vetName: "Dr. Arjun Patel",
    productType: "eggs",
    daysRemaining: 0,
    region: "South District"
  },
  {
    id: "C004",
    animalId: "COW-D012",
    animalType: "cattle",
    farmName: "Valley Dairy",
    farmId: "FARM-004",
    drugUsed: "Penicillin G",
    dateAdministered: "2024-01-08",
    withdrawalPeriod: 4,
    safeDate: "2024-01-12",
    complianceStatus: "non_compliant",
    collectionStatus: "unsafe",
    vetName: "Dr. Priya Sharma",
    productType: "milk",
    daysRemaining: 0,
    notes: "Milk collected during withdrawal period",
    region: "East District"
  },
  {
    id: "C005",
    animalId: "PIG-E345",
    animalType: "pig",
    farmName: "Fresh Farms",
    farmId: "FARM-005",
    drugUsed: "Florfenicol",
    dateAdministered: "2024-01-13",
    withdrawalPeriod: 21,
    safeDate: "2024-02-03",
    complianceStatus: "in_withdrawal",
    collectionStatus: "pending",
    vetName: "Dr. Arjun Patel",
    productType: "meat",
    daysRemaining: 12,
    region: "West District"
  },
  {
    id: "C006",
    animalId: "HEN-F678",
    animalType: "poultry",
    farmName: "Morning Eggs Co",
    farmId: "FARM-006",
    drugUsed: "Tylosin",
    dateAdministered: "2024-01-09",
    withdrawalPeriod: 3,
    safeDate: "2024-01-12",
    complianceStatus: "compliant",
    collectionStatus: "safe",
    vetName: "Dr. Priya Sharma",
    productType: "eggs",
    daysRemaining: 0,
    region: "North District"
  },
  {
    id: "C007",
    animalId: "COW-G901",
    animalType: "cattle",
    farmName: "Valley Dairy",
    farmId: "FARM-004",
    drugUsed: "Cephalexin",
    dateAdministered: "2024-01-11",
    withdrawalPeriod: 8,
    safeDate: "2024-01-19",
    complianceStatus: "non_compliant",
    collectionStatus: "unsafe",
    vetName: "Dr. Arjun Patel",
    productType: "milk",
    daysRemaining: 0,
    notes: "Missing withdrawal log entry",
    region: "East District"
  }
];

// Mock farm summary data for Authority view
const mockFarmSummaries: FarmSummary[] = [
  {
    farmId: "FARM-001",
    farmName: "Green Valley Livestock Farm",
    region: "North District",
    totalAnimals: 150,
    compliantCount: 140,
    nonCompliantCount: 10,
    complianceRate: 93.3,
    lastInspection: "2024-01-10"
  },
  {
    farmId: "FARM-002",
    farmName: "Sunrise Pig Farm",
    region: "North District",
    totalAnimals: 80,
    compliantCount: 75,
    nonCompliantCount: 5,
    complianceRate: 93.8,
    lastInspection: "2024-01-08"
  },
  {
    farmId: "FARM-003",
    farmName: "Golden Poultry Farm",
    region: "South District",
    totalAnimals: 300,
    compliantCount: 285,
    nonCompliantCount: 15,
    complianceRate: 95.0,
    lastInspection: "2024-01-12"
  },
  {
    farmId: "FARM-004",
    farmName: "Valley Dairy",
    region: "East District",
    totalAnimals: 120,
    compliantCount: 95,
    nonCompliantCount: 25,
    complianceRate: 79.2,
    lastInspection: "2024-01-05"
  },
  {
    farmId: "FARM-005",
    farmName: "Fresh Farms",
    region: "West District",
    totalAnimals: 200,
    compliantCount: 180,
    nonCompliantCount: 20,
    complianceRate: 90.0,
    lastInspection: "2024-01-09"
  }
];

export function ComplianceDashboard({ onNavigate, userName, userRole }: ComplianceDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAnimalType, setFilterAnimalType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Filter data based on user role
  const userData = useMemo(() => {
    let data = mockComplianceData;
    
    if (userRole === 'Farm Owner') {
      // Show only data from user's farm
      data = data.filter(record => record.farmName === "Green Valley Livestock Farm");
    } else if (userRole === 'Veterinarian') {
      // Show only data for animals treated by this vet
      data = data.filter(record => record.vetName === `Dr. ${userName.split(' ')[0]} ${userName.split(' ')[1] || 'Patel'}`);
    }
    // Authority sees all data
    
    return data;
  }, [userRole, userName]);

  // Apply filters
  const filteredData = useMemo(() => {
    return userData.filter(record => {
      const matchesSearch = record.animalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.drugUsed.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.farmName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAnimalType = filterAnimalType === "all" || record.animalType === filterAnimalType;
      const matchesStatus = filterStatus === "all" || record.complianceStatus === filterStatus;
      const matchesRegion = filterRegion === "all" || record.region === filterRegion;
      
      let matchesDateRange = true;
      if (dateRange.from && dateRange.to) {
        const recordDate = new Date(record.dateAdministered);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        matchesDateRange = recordDate >= fromDate && recordDate <= toDate;
      }
      
      return matchesSearch && matchesAnimalType && matchesStatus && matchesRegion && matchesDateRange;
    });
  }, [userData, searchQuery, filterAnimalType, filterStatus, filterRegion, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredData.length;
    const compliant = filteredData.filter(r => r.complianceStatus === 'compliant').length;
    const inWithdrawal = filteredData.filter(r => r.complianceStatus === 'in_withdrawal').length;
    const nonCompliant = filteredData.filter(r => r.complianceStatus === 'non_compliant').length;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
    
    return { total, compliant, inWithdrawal, nonCompliant, complianceRate };
  }, [filteredData]);

  // Chart data
  const chartData = useMemo(() => {
    const statusData = [
      { name: 'Compliant', value: stats.compliant, color: '#22c55e' },
      { name: 'In Withdrawal', value: stats.inWithdrawal, color: '#eab308' },
      { name: 'Non-Compliant', value: stats.nonCompliant, color: '#ef4444' }
    ];

    const animalTypeData = ['cattle', 'pig', 'poultry'].map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      compliant: filteredData.filter(r => r.animalType === type && r.complianceStatus === 'compliant').length,
      nonCompliant: filteredData.filter(r => r.animalType === type && r.complianceStatus === 'non_compliant').length,
      inWithdrawal: filteredData.filter(r => r.animalType === type && r.complianceStatus === 'in_withdrawal').length
    }));

    return { statusData, animalTypeData };
  }, [filteredData, stats]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_withdrawal': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'non_compliant': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-50 text-green-800 border-green-200';
      case 'in_withdrawal': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'non_compliant': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getAnimalIcon = (type: string) => {
    switch (type) {
      case 'cattle': return '🐄';
      case 'pig': return '🐷';
      case 'poultry': return '🐔';
      default: return '🐾';
    }
  };

  const getDashboardRoute = () => {
    switch (userRole) {
      case 'Farm Owner': return 'farm-owner-dashboard';
      case 'Farm Worker': return 'farm-worker-dashboard';
      case 'Veterinarian': return 'vet-dashboard';
      case 'Authority': return 'authority-dashboard';
      default: return 'home';
    }
  };

  // Top non-compliant farms for Authority view
  const topNonCompliantFarms = useMemo(() => {
    return mockFarmSummaries
      .sort((a, b) => a.complianceRate - b.complianceRate)
      .slice(0, 5);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-25 to-orange-25">
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
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: '#006400' }}>Compliance Overview</h1>
              <p className="text-sm font-bold" style={{ color: '#EA580C' }}>
                {userRole === 'Authority' ? 'Regional AMU Compliance Status' : 'Your AMU Compliance Status'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <ShieldCheck className="w-3 h-3 mr-1" />
              {userRole}
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">✅ Compliant</p>
                  <p className="text-2xl font-bold text-green-600">{stats.compliant}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">⚠ In Withdrawal</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inWithdrawal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">❌ Non-Compliant</p>
                  <p className="text-2xl font-bold text-red-600">{stats.nonCompliant}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.complianceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Authority gets additional charts */}
        {userRole === 'Authority' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Regional Compliance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.animalTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="compliant" fill="#22c55e" name="Compliant" />
                      <Bar dataKey="inWithdrawal" fill="#eab308" name="In Withdrawal" />
                      <Bar dataKey="nonCompliant" fill="#ef4444" name="Non-Compliant" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Top 5 Non-Compliant Farms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topNonCompliantFarms.map((farm, index) => (
                  <div key={farm.farmId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{farm.farmName}</p>
                        <p className="text-sm text-gray-600">{farm.region}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{farm.complianceRate}%</p>
                      <p className="text-xs text-gray-600">{farm.nonCompliantCount} violations</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search animals, drugs, farms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterAnimalType} onValueChange={setFilterAnimalType}>
                <SelectTrigger>
                  <SelectValue placeholder="Animal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Animals</SelectItem>
                  <SelectItem value="cattle">Cattle</SelectItem>
                  <SelectItem value="pig">Pigs</SelectItem>
                  <SelectItem value="poultry">Poultry</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="in_withdrawal">In Withdrawal</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                </SelectContent>
              </Select>

              {userRole === 'Authority' && (
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="North District">North District</SelectItem>
                    <SelectItem value="South District">South District</SelectItem>
                    <SelectItem value="East District">East District</SelectItem>
                    <SelectItem value="West District">West District</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Table */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Compliance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Animal ID</TableHead>
                    <TableHead>Type</TableHead>
                    {userRole === 'Authority' && <TableHead>Farm</TableHead>}
                    <TableHead>Drug Used</TableHead>
                    <TableHead>Withdrawal Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Collection Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getAnimalIcon(record.animalType)}</span>
                          {record.animalId}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{record.animalType}</TableCell>
                      {userRole === 'Authority' && (
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.farmName}</p>
                            <p className="text-sm text-gray-600">{record.region}</p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{record.drugUsed}</TableCell>
                      <TableCell>
                        {record.daysRemaining > 0 ? (
                          <span className="text-yellow-600 font-medium">
                            {record.daysRemaining} days left
                          </span>
                        ) : (
                          <span className="text-green-600">Complete</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.complianceStatus)}>
                          {getStatusIcon(record.complianceStatus)}
                          <span className="ml-1 capitalize">{record.complianceStatus.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.collectionStatus === 'safe' ? 'default' : 'destructive'}>
                          {record.collectionStatus === 'safe' ? 'Safe' : 
                           record.collectionStatus === 'unsafe' ? 'Unsafe' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Details Dialog */}
      <Dialog open={selectedRecord !== null} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <BarChart3 className="w-5 h-5" />
              Compliance Record Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Animal & Farm Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Animal ID:</strong> {selectedRecord.animalId}</p>
                    <p><strong>Type:</strong> {selectedRecord.animalType}</p>
                    <p><strong>Farm:</strong> {selectedRecord.farmName}</p>
                    {selectedRecord.region && <p><strong>Region:</strong> {selectedRecord.region}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Treatment Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Drug:</strong> {selectedRecord.drugUsed}</p>
                    <p><strong>Administered:</strong> {new Date(selectedRecord.dateAdministered).toLocaleDateString()}</p>
                    <p><strong>Veterinarian:</strong> {selectedRecord.vetName}</p>
                    <p><strong>Product:</strong> {selectedRecord.productType}</p>
                  </div>
                </div>
              </div>

              {/* Compliance Status */}
              <div className="space-y-2">
                <h4 className="font-medium">Compliance Status</h4>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(selectedRecord.complianceStatus)} text-lg px-4 py-2`}>
                      {getStatusIcon(selectedRecord.complianceStatus)}
                      <span className="ml-2 capitalize">{selectedRecord.complianceStatus.replace('_', ' ')}</span>
                    </Badge>
                    <div>
                      <p className="font-medium">Collection Status: {selectedRecord.collectionStatus}</p>
                      <p className="text-sm text-gray-600">
                        Safe Date: {new Date(selectedRecord.safeDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <h4 className="font-medium">Withdrawal Timeline</h4>
                <div className="space-y-2">
                  <Progress value={selectedRecord.daysRemaining === 0 ? 100 : 
                    Math.max(0, ((selectedRecord.withdrawalPeriod - selectedRecord.daysRemaining) / selectedRecord.withdrawalPeriod) * 100)} 
                    className="h-3" 
                  />
                  <div className="flex justify-between text-sm">
                    <span>Withdrawal Period: {selectedRecord.withdrawalPeriod} days</span>
                    <span>
                      {selectedRecord.daysRemaining > 0 ? 
                        `${selectedRecord.daysRemaining} days remaining` : 
                        'Withdrawal Complete'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200 text-yellow-800">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AlertTriangle, ArrowLeft, Search, Filter, Calendar, Clock, AlertCircle, CheckCircle, Pill, ShieldCheck, Timer } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface WithdrawalRecord {
  id: string;
  animalId: string;
  animalType: 'cattle' | 'pig' | 'poultry';
  medicineName: string;
  dateAdministered: string;
  withdrawalPeriodDays: number;
  safeCollectionDate: string;
  complianceStatus: 'safe' | 'in_withdrawal' | 'non_compliant';
  productType: 'milk' | 'eggs' | 'meat';
  batchNumber?: string;
  doseGiven: string;
  vetName: string;
  notes?: string;
}

interface WithdrawalTrackerPageProps {
  onNavigate: (screen: string) => void;
  userName: string;
}

// Mock withdrawal data
const mockWithdrawalData: WithdrawalRecord[] = [
  {
    id: "WD001",
    animalId: "COW-A123",
    animalType: "cattle",
    medicineName: "Amoxicillin",
    dateAdministered: "2024-01-10",
    withdrawalPeriodDays: 7,
    safeCollectionDate: "2024-01-17",
    complianceStatus: "safe",
    productType: "milk",
    batchNumber: "BATCH-001",
    doseGiven: "500mg",
    vetName: "Dr. Arjun Patel",
    notes: "Treatment for mastitis"
  },
  {
    id: "WD002",
    animalId: "PIG-B456",
    animalType: "pig",
    medicineName: "Classical Swine Fever Vaccine",
    dateAdministered: "2024-01-12",
    withdrawalPeriodDays: 0,
    safeCollectionDate: "2024-01-12",
    complianceStatus: "safe",
    productType: "meat",
    doseGiven: "1 dose (LOM strain)",
    vetName: "Dr. Priya Sharma",
    notes: "Preventive vaccination for hog cholera prevention"
  },
  {
    id: "WD003",
    animalId: "HEN-C789",
    animalType: "poultry",
    medicineName: "Newcastle Disease Vaccine (LaSota)",
    dateAdministered: "2024-01-14",
    withdrawalPeriodDays: 0,
    safeCollectionDate: "2024-01-14",
    complianceStatus: "safe",
    productType: "eggs",
    doseGiven: "1 dose (LaSota strain)",
    vetName: "Dr. Arjun Patel",
    notes: "Newcastle (Ranikhet) prevention - freeze-dried pellets"
  },
  {
    id: "WD004",
    animalId: "COW-D012",
    animalType: "cattle",
    medicineName: "Penicillin G",
    dateAdministered: "2024-01-08",
    withdrawalPeriodDays: 4,
    safeCollectionDate: "2024-01-12",
    complianceStatus: "non_compliant",
    productType: "milk",
    batchNumber: "BATCH-002",
    doseGiven: "300mg",
    vetName: "Dr. Priya Sharma",
    notes: "Milk collected early - disposed"
  },
  {
    id: "WD005",
    animalId: "PIG-E345",
    animalType: "pig",
    medicineName: "Florfenicol",
    dateAdministered: "2024-01-13",
    withdrawalPeriodDays: 21,
    safeCollectionDate: "2024-02-03",
    complianceStatus: "in_withdrawal",
    productType: "meat",
    doseGiven: "400mg",
    vetName: "Dr. Arjun Patel",
    notes: "Digestive issues treatment"
  },
  {
    id: "WD006",
    animalId: "HEN-F678",
    animalType: "poultry",
    medicineName: "Tylosin",
    dateAdministered: "2024-01-09",
    withdrawalPeriodDays: 3,
    safeCollectionDate: "2024-01-12",
    complianceStatus: "safe",
    productType: "eggs",
    doseGiven: "150mg",
    vetName: "Dr. Priya Sharma"
  }
];

export function WithdrawalTrackerPage({ onNavigate, userName }: WithdrawalTrackerPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecies, setFilterSpecies] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<WithdrawalRecord | null>(null);
  const [showEarlyCollectionAlert, setShowEarlyCollectionAlert] = useState<WithdrawalRecord | null>(null);

  // Calculate days remaining for each record
  const enrichedData = useMemo(() => {
    const today = new Date();
    return mockWithdrawalData.map(record => {
      const safeDate = new Date(record.safeCollectionDate);
      const adminDate = new Date(record.dateAdministered);
      const daysRemaining = Math.max(0, Math.ceil((safeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const totalDays = record.withdrawalPeriodDays;
      const progress = Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100);
      
      // Auto-update compliance status based on current date
      let updatedStatus = record.complianceStatus;
      if (daysRemaining === 0 && record.complianceStatus === 'in_withdrawal') {
        updatedStatus = 'safe';
      }
      
      return {
        ...record,
        complianceStatus: updatedStatus,
        daysRemaining,
        progress
      };
    });
  }, []);

  // Filter and search logic
  const filteredData = useMemo(() => {
    return enrichedData.filter(record => {
      const matchesSearch = record.animalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.medicineName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecies = filterSpecies === "all" || record.animalType === filterSpecies;
      const matchesStatus = filterStatus === "all" || record.complianceStatus === filterStatus;
      
      return matchesSearch && matchesSpecies && matchesStatus;
    });
  }, [enrichedData, searchQuery, filterSpecies, filterStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_withdrawal': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'non_compliant': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-50 text-green-800 border-green-200';
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

  const handleAttemptCollection = (record: WithdrawalRecord) => {
    if (record.complianceStatus === 'in_withdrawal') {
      setShowEarlyCollectionAlert(record);
    } else {
      alert(`✅ ${record.productType.charAt(0).toUpperCase() + record.productType.slice(1)} collection from ${record.animalId} is SAFE!`);
    }
  };

  const getRemainingTimeDisplay = (daysRemaining: number) => {
    if (daysRemaining === 0) return "Collection Safe Now";
    if (daysRemaining === 1) return "1 day left";
    return `${daysRemaining} days left`;
  };

  // Summary statistics
  const stats = useMemo(() => {
    const total = enrichedData.length;
    const safe = enrichedData.filter(r => r.complianceStatus === 'safe').length;
    const inWithdrawal = enrichedData.filter(r => r.complianceStatus === 'in_withdrawal').length;
    const nonCompliant = enrichedData.filter(r => r.complianceStatus === 'non_compliant').length;
    
    return { total, safe, inWithdrawal, nonCompliant };
  }, [enrichedData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-25 to-orange-25">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('farm-owner-dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: '#006400' }}>Withdrawal Tracker</h1>
              <p className="text-sm font-bold" style={{ color: '#EA580C' }}>Safe Collection Monitor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <ShieldCheck className="w-3 h-3 mr-1" />
              MRL Safety Monitoring
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Pill className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Safe to Collect</p>
                  <p className="text-2xl font-bold text-green-600">{stats.safe}</p>
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
                  <p className="text-sm text-gray-600">In Withdrawal</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inWithdrawal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Non-Compliant</p>
                  <p className="text-2xl font-bold text-red-600">{stats.nonCompliant}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by Animal ID or Medicine..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Species</SelectItem>
                    <SelectItem value="cattle">Cattle</SelectItem>
                    <SelectItem value="pig">Pigs</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="safe">Safe</SelectItem>
                    <SelectItem value="in_withdrawal">In Withdrawal</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animal/Batch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((record) => (
            <Card key={record.id} className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getAnimalIcon(record.animalType)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{record.animalId}</h3>
                        <p className="text-sm text-gray-600 capitalize">{record.animalType}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(record.complianceStatus)}>
                      {getStatusIcon(record.complianceStatus)}
                      <span className="ml-1 capitalize">{record.complianceStatus.replace('_', ' ')}</span>
                    </Badge>
                  </div>

                  {/* Medicine Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-primary" />
                      <span className="font-medium">{record.medicineName}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Administered: {new Date(record.dateAdministered).toLocaleDateString()}</p>
                      <p>Dose: {record.doseGiven}</p>
                    </div>
                  </div>

                  {/* Withdrawal Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Withdrawal Progress</span>
                      <span className="text-sm text-gray-600">{Math.round(record.progress)}%</span>
                    </div>
                    <Progress value={record.progress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${
                        record.complianceStatus === 'safe' ? 'text-green-600' :
                        record.complianceStatus === 'in_withdrawal' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {getRemainingTimeDisplay(record.daysRemaining)}
                      </span>
                      <span className="text-gray-600">
                        Safe from: {new Date(record.safeCollectionDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Product Type */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Product: <span className="font-medium capitalize">{record.productType}</span>
                    </span>
                    {record.batchNumber && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {record.batchNumber}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRecord(record)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAttemptCollection(record)}
                      className={`flex-1 ${
                        record.complianceStatus === 'safe' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : record.complianceStatus === 'in_withdrawal'
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {record.complianceStatus === 'safe' ? 'Collect' : 'Check Safety'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredData.length === 0 && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-8 text-center">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Early Collection Alert Dialog */}
      <Dialog open={showEarlyCollectionAlert !== null} onOpenChange={() => setShowEarlyCollectionAlert(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Collection Warning
            </DialogTitle>
          </DialogHeader>
          {showEarlyCollectionAlert && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>⚠️ {showEarlyCollectionAlert.productType.charAt(0).toUpperCase() + showEarlyCollectionAlert.productType.slice(1)} from {showEarlyCollectionAlert.animalId} is NOT safe to collect!</strong>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p><strong>Safe collection date:</strong> {new Date(showEarlyCollectionAlert.safeCollectionDate).toLocaleDateString()}</p>
                <p><strong>Days remaining:</strong> {showEarlyCollectionAlert.daysRemaining}</p>
                <p><strong>Medicine:</strong> {showEarlyCollectionAlert.medicineName}</p>
                <p><strong>Withdrawal period:</strong> {showEarlyCollectionAlert.withdrawalPeriodDays} days</p>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>MRL Compliance:</strong> Collecting products during withdrawal period violates 
                  Maximum Residue Limits (MRL) and food safety regulations. Please wait until the 
                  withdrawal period is complete.
                </p>
              </div>

              <Button 
                onClick={() => setShowEarlyCollectionAlert(null)}
                className="w-full"
              >
                I Understand
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Details Dialog */}
      <Dialog open={selectedRecord !== null} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Timer className="w-5 h-5" />
              Withdrawal Record Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {/* Animal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Animal Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {selectedRecord.animalId}</p>
                    <p><strong>Type:</strong> {selectedRecord.animalType}</p>
                    <p><strong>Batch:</strong> {selectedRecord.batchNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Treatment Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Medicine:</strong> {selectedRecord.medicineName}</p>
                    <p><strong>Dose:</strong> {selectedRecord.doseGiven}</p>
                    <p><strong>Vet:</strong> {selectedRecord.vetName}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <h4 className="font-medium">Withdrawal Timeline</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Date Administered:</span>
                    <span>{new Date(selectedRecord.dateAdministered).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Withdrawal Period:</span>
                    <span>{selectedRecord.withdrawalPeriodDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safe Collection Date:</span>
                    <span className="font-medium">{new Date(selectedRecord.safeCollectionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Remaining:</span>
                    <span className={`font-medium ${
                      selectedRecord.daysRemaining === 0 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {getRemainingTimeDisplay(selectedRecord.daysRemaining)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <h4 className="font-medium">Progress</h4>
                <Progress value={selectedRecord.progress} className="h-3" />
                <p className="text-sm text-center">{Math.round(selectedRecord.progress)}% Complete</p>
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-center">
                <Badge className={`${getStatusColor(selectedRecord.complianceStatus)} text-lg px-4 py-2`}>
                  {getStatusIcon(selectedRecord.complianceStatus)}
                  <span className="ml-2 capitalize">{selectedRecord.complianceStatus.replace('_', ' ')}</span>
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { 
  Pill, Clock, CheckCircle, Edit, X, User,
  AlertCircle, TrendingUp, Activity, Stethoscope
} from "lucide-react";

interface TreatmentRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  animalId: string;
  animalType: 'cattle' | 'pig' | 'poultry';
  drugName: string;
  dosage: string;
  reason: string;
  submittedTime: string;
  urgency: 'high' | 'medium' | 'low';
}

interface VetTreatmentDashboardProps {
  userName: string;
}

export function VetTreatmentDashboard({ userName }: VetTreatmentDashboardProps) {
  const [selectedRequest, setSelectedRequest] = useState<TreatmentRequest | null>(null);

  // Mock pending requests
  const pendingRequests: TreatmentRequest[] = [
    {
      id: "req-001",
      farmerId: "farmer-001",
      farmerName: "Rajesh Kumar",
      animalId: "C089",
      animalType: "cattle",
      drugName: "Amoxicillin",
      dosage: "15ml",
      reason: "Respiratory infection with fever",
      submittedTime: "2 hours ago",
      urgency: "high"
    },
    {
      id: "req-002", 
      farmerId: "farmer-002",
      farmerName: "Priya Sharma",
      animalId: "P078",
      animalType: "pig",
      drugName: "Florfenicol",
      dosage: "20ml",
      reason: "Swine respiratory disease outbreak",
      submittedTime: "1 hour ago",
      urgency: "high"
    },
    {
      id: "req-003",
      farmerId: "farmer-003", 
      farmerName: "Vikram Singh",
      animalId: "CH200",
      animalType: "poultry",
      drugName: "Tylosin",
      dosage: "8ml",
      reason: "Chronic respiratory disease in broilers",
      submittedTime: "30 minutes ago",
      urgency: "medium"
    },
    {
      id: "req-004",
      farmerId: "farmer-004",
      farmerName: "Anita Devi", 
      animalId: "C156",
      animalType: "cattle",
      drugName: "Oxytetracycline",
      dosage: "12ml",
      reason: "Mastitis treatment",
      submittedTime: "15 minutes ago",
      urgency: "medium"
    }
  ];

  // Statistics
  const stats = {
    pendingToday: pendingRequests.length,
    approvedToday: 12,
    editedToday: 3,
    totalFarmers: 28
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getAnimalIcon = (animalType: string) => {
    switch (animalType) {
      case 'cattle': return '🐄';
      case 'pig': return '🐷';
      case 'poultry': return '🐔';
      default: return '🐄';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Pending Today</p>
                <p className="text-xl font-bold text-yellow-900">{stats.pendingToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Approved Today</p>
                <p className="text-xl font-bold text-green-900">{stats.approvedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Edited Today</p>
                <p className="text-xl font-bold text-blue-900">{stats.editedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Active Farmers</p>
                <p className="text-xl font-bold text-purple-900">{stats.totalFarmers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card className="lg:col-span-2 border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Pill className="w-5 h-5" />
            Treatment Requests Requiring Review
            <Badge className="bg-red-500 text-white ml-auto">
              {pendingRequests.filter(req => req.urgency === 'high').length} urgent
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id} 
                  className={`p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                    request.urgency === 'high' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getAnimalIcon(request.animalType)}</span>
                      <div>
                        <h4 className="font-medium text-sm">{request.farmerName}</h4>
                        <p className="text-xs text-gray-600">
                          Animal {request.animalId} • {request.animalType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getUrgencyColor(request.urgency)} text-white text-xs`}>
                        {request.urgency}
                      </Badge>
                      <span className="text-xs text-gray-500">{request.submittedTime}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p><strong>Drug:</strong> {request.drugName}</p>
                      <p><strong>Dosage:</strong> {request.dosage}</p>
                    </div>
                    <div>
                      <p><strong>Reason:</strong> {request.reason}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 flex-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Quick Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Review & Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 flex-1">
                      <X className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {pendingRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="text-sm">All treatment requests reviewed!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
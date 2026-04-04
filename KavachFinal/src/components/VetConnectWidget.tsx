import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Stethoscope, Phone, Mail, MessageCircle, Calendar, 
  Plus, Clock, CheckCircle, Edit, AlertCircle,
  Send, Star, Users
} from "lucide-react";

interface VetConnectWidgetProps {
  userName: string;
}

export function VetConnectWidget({ userName }: VetConnectWidgetProps) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Mock vet data
  const assignedVet = {
    name: "Dr. Arjun Patel",
    qualification: "BVSc & AH, PhD",
    phone: "+91 9876543210",
    email: "arjun.patel@vetcare.in",
    avatar: "https://images.unsplash.com/photo-1659353887804-fc7f9313021a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBpbmRpYW4lMjB2ZXRlcmluYXJpYW4lMjBkb2N0b3J8ZW58MXx8fHwxNzU3NDkwMjI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4.8,
    isOnline: true,
    responseTime: "Usually responds within 2 hours"
  };

  // Mock treatment status data
  const treatmentStats = {
    pending: 2,
    approved: 8,
    edited: 1,
    total: 11
  };

  // Recent submissions
  const recentSubmissions = [
    {
      id: 1,
      animalId: "C089",
      drug: "Amoxicillin",
      status: "pending",
      submittedDate: "2 hours ago"
    },
    {
      id: 2,
      animalId: "P045", 
      drug: "Oxytetracycline",
      status: "approved",
      submittedDate: "1 day ago"
    },
    {
      id: 3,
      animalId: "CH112",
      drug: "Enrofloxacin", 
      status: "edited",
      submittedDate: "3 days ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'edited': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'approved': return <CheckCircle className="w-3 h-3" />;
      case 'edited': return <Edit className="w-3 h-3" />;
      case 'rejected': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <>
      <Card className="bg-white shadow-lg border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary text-lg">
            <Stethoscope className="w-5 h-5" />
            My Vet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vet Profile Section */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={assignedVet.avatar} alt={assignedVet.name} />
                <AvatarFallback>
                  <Stethoscope className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              {assignedVet.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{assignedVet.name}</h4>
              <p className="text-xs text-gray-600">{assignedVet.qualification}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-600">{assignedVet.rating}</span>
                <span className="text-xs text-gray-500">• {assignedVet.responseTime}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1"
            >
              <Phone className="w-3 h-3" />
              Call
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="w-3 h-3" />
              Chat
            </Button>
          </div>

          {/* Treatment Request Button */}
          <Button 
            onClick={() => setShowRequestForm(true)}
            className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Request Treatment Approval
          </Button>

          {/* Treatment Status Summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <p className="text-lg font-bold text-yellow-600">{treatmentStats.pending}</p>
              <p className="text-xs text-yellow-700">Pending</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{treatmentStats.approved}</p>
              <p className="text-xs text-green-700">Approved</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">{treatmentStats.edited}</p>
              <p className="text-xs text-blue-700">Edited</p>
            </div>
          </div>

          {/* Recent Submissions */}
          <div>
            <h5 className="font-medium text-sm mb-2">Recent Submissions</h5>
            <div className="space-y-2">
              {recentSubmissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{submission.animalId} - {submission.drug}</span>
                  <div className="flex items-center gap-1">
                    <Badge 
                      className={`${getStatusColor(submission.status)} text-white text-xs px-1 py-0 h-5 flex items-center gap-1`}
                    >
                      {getStatusIcon(submission.status)}
                      {submission.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* View All Button */}
          <Button variant="outline" size="sm" className="w-full text-xs">
            View All Treatment History ({treatmentStats.total})
          </Button>
        </CardContent>
      </Card>

      {/* Treatment Request Dialog */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Treatment Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Animal ID</Label>
                <Input placeholder="e.g., C089" className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Animal Type</Label>
                <Select>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cattle">Cattle</SelectItem>
                    <SelectItem value="pig">Pig</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Drug Name</Label>
              <Input placeholder="e.g., Amoxicillin" className="h-8" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Dosage</Label>
                <Input placeholder="e.g., 15ml" className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Route</Label>
                <Select>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intramuscular">Intramuscular</SelectItem>
                    <SelectItem value="intravenous">Intravenous</SelectItem>
                    <SelectItem value="oral">Oral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reason for Treatment</Label>
              <Textarea 
                placeholder="Describe symptoms and reason..." 
                className="min-h-16 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRequestForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button className="flex-1 bg-secondary hover:bg-secondary/90">
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Chat Dialog */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat with Dr. {assignedVet.name.split(' ')[1]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg h-32 overflow-y-auto">
              <div className="space-y-2 text-sm">
                <div className="bg-white p-2 rounded text-gray-700">
                  <p>Hi Dr. Patel, I need to discuss treatment for cow C089...</p>
                  <span className="text-xs text-gray-500">You • 2 hours ago</span>
                </div>
                <div className="bg-primary p-2 rounded text-white ml-4">
                  <p>I'll review the details. Can you send me the symptoms?</p>
                  <span className="text-xs opacity-75">Dr. Patel • 1 hour ago</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Type your message..." className="flex-1" />
              <Button size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  Stethoscope, Phone, MessageCircle, Calendar, Clock, Check, X, Edit,
  AlertCircle, Send, User, ChevronDown, ChevronUp, Bell, BellOff,
  Pill, Activity, FileText, Plus, CheckCircle, XCircle, Eye, BarChart3
} from "lucide-react";
import { mockDB, TreatmentLog, ChatMessage } from "../services/mockDatabase";

// Types
interface LocalTreatmentLog {
  id: string;
  animalId: string;
  drugName: string;
  dosage: string;
  reason: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  vetComment?: string;
  farmer: string;
  animalType: 'pig' | 'poultry' | 'cattle';
  withdrawalPeriod?: string;
  lastEdited?: string;
}

interface VetInfo {
  id: number;
  name: string;
  qualification: string;
  phone: string;
  email: string;
  photoUrl: string;
  specialty: string;
  rating: number;
  isOnline: boolean;
}

interface LocalChatMessage {
  id: string;
  sender: 'farmer' | 'vet';
  message: string;
  timestamp: string;
  read: boolean;
}

// Mock Data
const mockVetInfo: VetInfo = {
  id: 1,
  name: "Dr. Arjun Patel",
  qualification: "BVSc & AH, PhD",
  phone: "+91 9876543210",
  email: "vet@kavach.com",
  photoUrl: "https://images.unsplash.com/photo-1659353887804-fc7f9313021a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBpbmRpYW4lMjB2ZXRlcmluYXJpYW4lMjBkb2N0b3J8ZW58MXx8fHwxNzU3NDkwMjI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  specialty: "Large Animal Veterinarian",
  rating: 4.8,
  isOnline: true
};



// Components for Farmer Dashboard
export function FarmerVetConnect({ farmerEmail = "owner@kavach.com" }: { farmerEmail?: string }) {
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    animalId: '',
    animalType: 'pig',
    drugName: '',
    dosage: '',
    reason: ''
  });
  const [chatMessage, setChatMessage] = useState('');
  const [treatmentLogs, setTreatmentLogs] = useState<LocalTreatmentLog[]>([]);
  const [assignedVet, setAssignedVet] = useState<VetInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<LocalChatMessage[]>([]);

  // Load data from database on component mount
  useEffect(() => {
    loadTreatmentLogs();
    loadAssignedVet();
    loadChatMessages();
  }, [farmerEmail]);

  const loadTreatmentLogs = () => {
    const logs = mockDB.getTreatmentLogsByFarmer(farmerEmail);
    const mappedLogs: LocalTreatmentLog[] = logs.map(log => ({
      id: log.id,
      animalId: log.animalId,
      drugName: log.drugName,
      dosage: log.dosage,
      reason: log.reason,
      submissionDate: log.submissionDate,
      status: log.status,
      vetComment: log.vetComment,
      farmer: "Rajesh Kumar", // We'll use the logged in farmer name
      animalType: log.animalType,
      withdrawalPeriod: log.withdrawalPeriod,
      lastEdited: log.lastEdited
    }));
    setTreatmentLogs(mappedLogs);
  };

  const loadAssignedVet = () => {
    const vet = mockDB.getAssignedVetForFarmer(farmerEmail);
    if (vet) {
      setAssignedVet({
        id: 1,
        name: vet.fullName,
        qualification: "BVSc & AH, PhD", // Default qualification
        phone: vet.phoneNumber,
        email: vet.email,
        photoUrl: mockVetInfo.photoUrl,
        specialty: "Large Animal Veterinarian",
        rating: 4.8,
        isOnline: true
      });
    }
  };

  const loadChatMessages = () => {
    const vet = mockDB.getAssignedVetForFarmer(farmerEmail);
    if (vet) {
      const messages = mockDB.getChatMessagesBetween(farmerEmail, vet.email);
      const mappedMessages: LocalChatMessage[] = messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
        read: msg.read
      }));
      setChatMessages(mappedMessages);
    }
  };

  const handleSubmitTreatment = () => {
    if (assignedVet) {
      const result = mockDB.submitTreatmentLog({
        animalId: treatmentForm.animalId,
        drugName: treatmentForm.drugName,
        dosage: treatmentForm.dosage,
        reason: treatmentForm.reason,
        submissionDate: new Date().toISOString().split('T')[0],
        farmerEmail: farmerEmail,
        vetEmail: assignedVet.email,
        animalType: treatmentForm.animalType as 'pig' | 'poultry' | 'cattle',
        withdrawalPeriod: undefined
      });

      if (result.success) {
        loadTreatmentLogs(); // Refresh the logs
        setShowTreatmentForm(false);
        setTreatmentForm({
          animalId: '',
          animalType: 'pig',
          drugName: '',
          dosage: '',
          reason: ''
        });
      }
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim() && assignedVet) {
      const result = mockDB.sendChatMessage(farmerEmail, assignedVet.email, 'farmer', chatMessage);
      if (result.success) {
        loadChatMessages(); // Refresh messages
        setChatMessage('');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'edited': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'edited': return <Edit className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* My Vet Section */}
      <Card className="bg-white shadow-lg border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Stethoscope className="w-5 h-5" />
            My Vet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vet Info Card */}
          {assignedVet ? (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <ImageWithFallback
                    src={assignedVet.photoUrl}
                    alt={assignedVet.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    assignedVet.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary">{assignedVet.name}</h4>
                  <p className="text-sm text-secondary">{assignedVet.qualification}</p>
                  <p className="text-sm text-muted-foreground">{assignedVet.specialty}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(assignedVet.rating) ? "★" : "☆"}>
                          {i < Math.floor(assignedVet.rating) ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{assignedVet.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${assignedVet.phone}`)}
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChat(true)}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-muted-foreground">No veterinarian assigned</p>
              <Button variant="outline" size="sm" className="mt-2">
                Request Vet Assignment
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => setShowTreatmentForm(true)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Request Treatment Approval
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule Appointment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Log History */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="w-5 h-5" />
            Treatment Log History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {treatmentLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {log.animalType === 'pig' ? '🐷' : log.animalType === 'poultry' ? '🐔' : '🐄'}
                    </span>
                    <div>
                      <h5 className="font-medium text-foreground">{log.animalId}</h5>
                      <p className="text-sm text-muted-foreground">{log.drugName} - {log.dosage}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(log.status)} flex items-center gap-1`}>
                    {getStatusIcon(log.status)}
                    {log.status === 'pending' && 'Waiting for vet review'}
                    {log.status === 'approved' && 'Approved by vet'}
                    {log.status === 'edited' && 'Edited by vet'}
                    {log.status === 'rejected' && 'Rejected by vet'}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  <p><strong>Reason:</strong> {log.reason}</p>
                  <p><strong>Submitted:</strong> {log.submissionDate}</p>
                  {log.withdrawalPeriod && (
                    <p><strong>Withdrawal Period:</strong> {log.withdrawalPeriod}</p>
                  )}
                </div>

                {log.vetComment && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                    <p className="text-sm text-blue-800">
                      <strong>Vet Comment:</strong> {log.vetComment}
                    </p>
                    {log.lastEdited && (
                      <p className="text-xs text-blue-600 mt-1">
                        Last edited: {log.lastEdited}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Treatment Request Dialog */}
      <Dialog open={showTreatmentForm} onOpenChange={setShowTreatmentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Request Treatment Approval</DialogTitle>
            <DialogDescription>
              Submit treatment details for veterinarian review and approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="animalId">Animal ID</Label>
              <Input
                id="animalId"
                placeholder="e.g., PIG-001, POULTRY-025"
                value={treatmentForm.animalId}
                onChange={(e) => setTreatmentForm({...treatmentForm, animalId: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="animalType">Animal Type</Label>
              <Select value={treatmentForm.animalType} onValueChange={(value) => setTreatmentForm({...treatmentForm, animalType: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pig">🐷 Pig</SelectItem>
                  <SelectItem value="poultry">🐔 Poultry</SelectItem>
                  <SelectItem value="cattle">🐄 Cattle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="drugName">Drug/Medicine Name</Label>
              <Input
                id="drugName"
                placeholder="e.g., Amoxicillin, Tylosin"
                value={treatmentForm.drugName}
                onChange={(e) => setTreatmentForm({...treatmentForm, drugName: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="dosage">Proposed Dosage</Label>
              <Input
                id="dosage"
                placeholder="e.g., 15ml twice daily"
                value={treatmentForm.dosage}
                onChange={(e) => setTreatmentForm({...treatmentForm, dosage: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="reason">Reason for Treatment</Label>
              <Textarea
                id="reason"
                placeholder="Describe symptoms and reason for treatment..."
                value={treatmentForm.reason}
                onChange={(e) => setTreatmentForm({...treatmentForm, reason: e.target.value})}
                rows={3}
              />
            </div>
            
            <Button
              onClick={handleSubmitTreatment}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!treatmentForm.animalId || !treatmentForm.drugName || !treatmentForm.dosage || !treatmentForm.reason || !assignedVet}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-md max-h-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <MessageCircle className="w-5 h-5" />
              Chat with {assignedVet?.name || 'Veterinarian'}
            </DialogTitle>
            <DialogDescription>
              Send messages and communicate directly with your assigned veterinarian.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-[400px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'farmer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender === 'farmer' 
                      ? 'bg-primary text-white' 
                      : 'bg-white border'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender === 'farmer' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Message Input */}
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Components for Vet Dashboard
export function VetFarmerSubmissions({ vetEmail = "vet@kavach.com" }: { vetEmail?: string }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [pendingLogs, setPendingLogs] = useState<TreatmentLog[]>([]);

  // Load pending treatment logs from database
  useEffect(() => {
    loadPendingLogs();
  }, [vetEmail]);

  const loadPendingLogs = () => {
    const logs = mockDB.getPendingTreatmentLogsForVet(vetEmail);
    setPendingLogs(logs);
  };

  const handleApprove = (logId: string) => {
    const result = mockDB.updateTreatmentLogStatus(logId, 'approved', 'Approved by veterinarian');
    if (result.success) {
      loadPendingLogs(); // Refresh the list
    }
  };

  const handleReject = (logId: string) => {
    const result = mockDB.updateTreatmentLogStatus(logId, 'rejected', 'Rejected by veterinarian - requires consultation');
    if (result.success) {
      loadPendingLogs(); // Refresh the list
    }
  };

  const handleEdit = (logId: string) => {
    const log = pendingLogs.find(l => l.id === logId);
    if (log) {
      setEditingId(logId);
      setEditDosage(log.dosage);
      setEditComment(log.vetComment || '');
    }
  };

  const handleSaveEdit = () => {
    if (editingId) {
      const result = mockDB.updateTreatmentLogStatus(editingId, 'edited', editComment, editDosage);
      if (result.success) {
        loadPendingLogs(); // Refresh the list
        setEditingId(null);
        setEditComment('');
        setEditDosage('');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white shadow-lg border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              Farmer Submissions
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge className="bg-secondary text-white">
                {pendingLogs.length} Pending
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="flex items-center gap-2"
              >
                {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Treatment Logs to Review */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Treatment Logs to Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {log.animalType === 'pig' ? '🐷' : log.animalType === 'poultry' ? '🐔' : '🐄'}
                    </span>
                    <div>
                      <h5 className="font-medium text-foreground">{log.animalId}</h5>
                      <p className="text-sm text-muted-foreground">Farmer: {log.farmerEmail}</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Pending Review
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-primary">Drug Name:</span>
                      <p className="text-sm">{log.drugName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-primary">Proposed Dosage:</span>
                      <p className="text-sm">{log.dosage}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-primary">Submission Date:</span>
                      <p className="text-sm">{log.submissionDate}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-primary">Withdrawal Period:</span>
                      <p className="text-sm">{log.withdrawalPeriod || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-sm font-medium text-primary">Reason for Treatment:</span>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded border">{log.reason}</p>
                </div>

                {editingId === log.id ? (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                    <div>
                      <Label htmlFor={`edit-dosage-${log.id}`}>Revised Dosage</Label>
                      <Input
                        id={`edit-dosage-${log.id}`}
                        value={editDosage}
                        onChange={(e) => setEditDosage(e.target.value)}
                        placeholder="Enter revised dosage"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-comment-${log.id}`}>Veterinary Comment</Label>
                      <Textarea
                        id={`edit-comment-${log.id}`}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Add your comments and recommendations..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEdit}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleApprove(log.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleEdit(log.id)}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleReject(log.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {pendingLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending treatment submissions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 text-left">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-primary" />
                <div>
                  <h4 className="font-medium">Message All Farmers</h4>
                  <p className="text-sm text-muted-foreground">Send updates or alerts</p>
                </div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 text-left">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-primary" />
                <div>
                  <h4 className="font-medium">Treatment Analytics</h4>
                  <p className="text-sm text-muted-foreground">View usage patterns</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
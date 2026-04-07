import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AlertSystem } from "./AlertSystem";
import { 
  Phone, Calendar, User, CheckCircle, XCircle, ExternalLink,
  MapPin, AlertTriangle, Shield, Bell, ChevronDown, ChevronUp,
  Clock, Activity, TrendingUp, Users, Building, Zap, Book,
  Play, Youtube, Download, CheckSquare, Cloud, Droplets, Wind, Thermometer, BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import logoImg from 'figma:asset/28cc7f8b67ba61bb13e03c30f73fd05e9d3d8a2c.png';

// Shared task interface
interface Task {
  id: number;
  description: string;
  worker: string;
  status: 'pending' | 'worker_done' | 'approved';
  dueDate: string;
  reference: string;
  priority: 'high' | 'medium' | 'low';
  assignedBy?: string;
}

interface FarmWorkerDashboardProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName: string;
  workerName: string;
  userRole: string;
  tasks: Task[];
  onTaskUpdate: (taskId: number, newStatus: 'pending' | 'worker_done' | 'approved') => void;
}

// Mock data
const mockWorkerData = {
  profile: {
    name: "Suresh Kumar",
    assignedFarm: "Green Valley Livestock Farm",
    role: "Senior Farm Worker",
    shift: "Morning Shift (6 AM - 2 PM)",
    phone: "+91 9876543210",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b3JrZXJ8ZW58MXx8fHwxNzU3NDkwMjI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  farmOverview: {
    totalCattle: 150,
    buildings: 8,
    resources: ["Feed Storage", "Water System", "Cleaning Equipment", "Medical Supplies"],
    animalTypes: [
      { type: "Cattle", count: 85, icon: "🐄", status: "healthy" },
      { type: "Pigs", count: 45, icon: "🐷", status: "vaccination_due" },
      { type: "Poultry", count: 220, icon: "🐔", status: "healthy" }
    ],
    assignments: [
      "Building A - Cattle Shed",
      "Building C - Poultry House", 
      "Feed Distribution",
      "Water System Maintenance"
    ]
  },
  availableVets: [
    {
      id: 1,
      name: "Dr. Arjun Patel",
      specialty: "Large Animal Vet",
      phone: "+91 9876543210",
      email: "arjun.patel@vetcare.in",
      status: "online",
      distance: "8.5 km"
    },
    {
      id: 2,
      name: "Dr. Priya Sharma", 
      specialty: "Poultry Specialist",
      phone: "+91 9887654321",
      email: "priya.sharma@vetcare.in",
      status: "online",
      distance: "15.2 km"
    }
  ],
  biosecurityProtocols: [
    {
      id: 1,
      title: "African Swine Fever Prevention",
      category: "Disease-Specific",
      severity: "Critical",
      icon: "🐷",
      description: "Complete prevention protocol for ASF",
      steps: 5,
      estimatedTime: "30 mins"
    },
    {
      id: 2,
      title: "Visitor Management Protocol",
      category: "General",
      severity: "General",
      icon: "👥",
      description: "Standard visitor entry procedures",
      steps: 8,
      estimatedTime: "15 mins"
    },
    {
      id: 3,
      title: "Daily Hygiene Checklist",
      category: "Practice-Specific",
      severity: "General",
      icon: "🧼",
      description: "Daily cleaning and disinfection tasks",
      steps: 12,
      estimatedTime: "45 mins"
    },
    {
      id: 4,
      title: "Feed Quality Control",
      category: "Practice-Specific",
      severity: "Govt Recommended",
      icon: "🌾",
      description: "Feed inspection and storage protocols",
      steps: 6,
      estimatedTime: "20 mins"
    }
  ]
};

// Components
function WorkerProfileCard() {
  const { profile, farmOverview } = mockWorkerData;
  
  return (
    <Card className="bg-white border-l-4 border-l-primary shadow-lg">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <ImageWithFallback
              src={profile.imageUrl}
              alt={profile.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-secondary text-white rounded-full p-1">
              <User className="w-3 h-3" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">{profile.name}</h3>
            <p className="text-secondary font-medium">{profile.role}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4 text-primary" />
            <span className="font-medium">{profile.assignedFarm}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-primary" />
            <span>{farmOverview.totalCattle} Animals • {farmOverview.buildings} Buildings</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" />
            <span>{profile.shift}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function EmergencyContactButton() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    vetId: '',
    date: '',
    time: '',
    reason: ''
  });

  const handleRequestAppointment = () => {
    console.log('Appointment requested:', appointmentData);
    setShowAppointmentForm(false);
    setShowDropdown(false);
    setAppointmentData({ vetId: '', date: '', time: '', reason: '' });
  };

  return (
    <div className="relative">
      <Button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 animate-pulse shadow-lg"
        size="lg"
      >
        <Bell className="w-5 h-5 mr-2" />
        Emergency Contact
        {showDropdown ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
      </Button>

      {showDropdown && (
        <Card className="absolute top-full right-0 mt-2 w-80 z-50 shadow-xl border">
          <CardContent className="p-4">
            <h4 className="font-semibold text-primary mb-3">Available Veterinarians</h4>
            <div className="space-y-3 mb-4">
              {mockWorkerData.availableVets.map((vet) => (
                <div key={vet.id} className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-green-800">{vet.name}</h5>
                    <Badge className="bg-green-500 text-white text-xs">Online</Badge>
                  </div>
                  <p className="text-sm text-green-700 mb-2">{vet.specialty}</p>
                  <div className="flex items-center gap-4 text-xs text-green-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {vet.distance}
                    </span>
                    <button 
                      className="flex items-center gap-1 hover:text-green-800"
                      onClick={() => window.open(`tel:${vet.phone}`)}
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={() => setShowAppointmentForm(true)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Request Appointment
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Veterinary Appointment</DialogTitle>
            <DialogDescription>
              Fill out the form below to request an appointment with a veterinarian.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vet">Select Veterinarian</Label>
              <Select value={appointmentData.vetId} onValueChange={(value) => setAppointmentData({...appointmentData, vetId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vet" />
                </SelectTrigger>
                <SelectContent>
                  {mockWorkerData.availableVets.map((vet) => (
                    <SelectItem key={vet.id} value={vet.id.toString()}>
                      {vet.name} - {vet.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date">Preferred Date</Label>
              <Input 
                type="date" 
                value={appointmentData.date}
                onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="time">Preferred Time</Label>
              <Input 
                type="time" 
                value={appointmentData.time}
                onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="reason">Reason for Visit</Label>
              <Input 
                placeholder="Describe the issue..."
                value={appointmentData.reason}
                onChange={(e) => setAppointmentData({...appointmentData, reason: e.target.value})}
              />
            </div>
            
            <Button 
              onClick={handleRequestAppointment} 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!appointmentData.vetId || !appointmentData.date || !appointmentData.time}
            >
              Request Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FarmInformation() {
  const { farmOverview } = mockWorkerData;

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold" style={{ color: '#006400' }}>Farm Information (View Only)</CardTitle>
        <p className="text-sm font-bold mt-1" style={{ color: '#EA580C' }}>
          View farm statistics and animal health metrics
        </p>
      </CardHeader>
      <CardContent>
        {/* Farm Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg bg-blue-50 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Total Cattle</p>
                <p className="text-2xl font-bold text-blue-800">{farmOverview.totalCattle}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-purple-50 border-l-4 border-l-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Buildings</p>
                <p className="text-2xl font-bold text-purple-800">{farmOverview.buildings}</p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-orange-50 border-l-4 border-l-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Animal Types</p>
                <p className="text-2xl font-bold text-orange-800">{farmOverview.animalTypes.length}</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Animal Distribution */}
        <div className="mb-6">
          <h4 className="font-semibold text-primary mb-3">Animal Distribution</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {farmOverview.animalTypes.map((animal, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{animal.icon}</span>
                  <div>
                    <h5 className="font-medium">{animal.type}</h5>
                    <p className="text-lg font-bold">{animal.count} animals</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resources and Assignments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-primary mb-3">Available Resources</h4>
            <div className="space-y-2">
              {farmOverview.resources.map((resource, index) => (
                <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-l-green-500">
                  <span className="text-sm font-medium">{resource}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-primary mb-3">My Assignments</h4>
            <div className="space-y-2">
              {farmOverview.assignments.map((assignment, index) => (
                <div key={index} className="p-2 bg-blue-50 rounded border-l-4 border-l-blue-500">
                  <span className="text-sm font-medium">{assignment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FarmTasksList({ tasks, workerName, onTaskUpdate }: { tasks: Task[], workerName: string, onTaskUpdate: (taskId: number, newStatus: 'pending' | 'worker_done' | 'approved') => void }) {
  const markTaskDone = (taskId: number) => {
    onTaskUpdate(taskId, 'worker_done');
  };

  const workerTasks = tasks.filter(task => task.worker === "Farm Worker" || task.worker === workerName);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'worker_done':
        return <Badge className="bg-blue-500 text-white">Awaiting Approval</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const completedTasks = workerTasks.filter(task => task.status === 'worker_done' || task.status === 'approved').length;
  const progressPercentage = workerTasks.length > 0 ? (completedTasks / workerTasks.length) * 100 : 0;

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-primary">Task List (Linked with Owner)</CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-lg font-semibold text-primary">{completedTasks}/{workerTasks.length}</p>
          </div>
        </div>
        <Progress value={progressPercentage} className="mt-2" />
      </CardHeader>
      <CardContent>
        {workerTasks.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tasks Assigned</h3>
            <p className="text-muted-foreground">
              You don't have any tasks assigned at the moment. Check back later or contact your farm owner.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workerTasks.map((task) => (
              <div key={task.id} className={`p-4 border rounded-lg border-l-4 ${getPriorityColor(task.priority)} ${
                task.status === 'approved' ? 'bg-green-50' : task.status === 'worker_done' ? 'bg-blue-50' : 'bg-white'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{task.description}</h5>
                  {getStatusBadge(task.status)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span>Assigned by: {task.assignedBy}</span>
                  <span>Due: {task.dueDate}</span>
                  <span className="capitalize">Priority: {task.priority}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <a 
                    href={task.reference} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Reference Guide
                  </a>
                  
                  {task.status === 'pending' && (
                    <Button 
                      onClick={() => markTaskDone(task.id)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Done
                    </Button>
                  )}
                  
                  {task.status === 'worker_done' && (
                    <span className="text-sm text-blue-600 font-medium">Awaiting owner approval</span>
                  )}
                  
                  {task.status === 'approved' && (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BiosecurityProtocolLibrary() {
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const { biosecurityProtocols } = mockWorkerData;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'border-red-500 bg-red-50';
      case 'Govt Recommended': return 'border-blue-500 bg-blue-50';
      case 'General': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical': return <Badge className="bg-red-500 text-white">Critical</Badge>;
      case 'Govt Recommended': return <Badge className="bg-blue-500 text-white">Govt Recommended</Badge>;
      case 'General': return <Badge className="bg-gray-500 text-white">General</Badge>;
      default: return <Badge className="bg-gray-500 text-white">General</Badge>;
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Book className="w-5 h-5" />
          Biosecurity Protocol Library (Shared)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {biosecurityProtocols.map((protocol) => (
            <div key={protocol.id} className={`p-4 border-2 rounded-lg ${getSeverityColor(protocol.severity)} hover:shadow-md transition-shadow cursor-pointer`}
                 onClick={() => setSelectedProtocol(protocol)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">{protocol.icon}</div>
                <div className="flex-1">
                  <h5 className="font-semibold">{protocol.title}</h5>
                  <p className="text-xs text-gray-600">{protocol.category}</p>
                </div>
                {getSeverityBadge(protocol.severity)}
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{protocol.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{protocol.steps} steps</span>
                <span>{protocol.estimatedTime}</span>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={selectedProtocol !== null} onOpenChange={() => setSelectedProtocol(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <span className="text-2xl">{selectedProtocol?.icon}</span>
              {selectedProtocol?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedProtocol && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getSeverityBadge(selectedProtocol.severity)}
                <span className="text-sm text-gray-600">{selectedProtocol.category}</span>
              </div>
              
              <p className="text-gray-700">{selectedProtocol.description}</p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-semibold mb-2">Step-by-Step Guidelines:</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <span>Prepare necessary equipment and materials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <span>Follow safety protocols and wear protective gear</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <span>Execute the procedure as per guidelines</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <span>Document completion and results</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-red-600 hover:bg-red-700">
                  <Youtube className="w-4 h-4 mr-2" />
                  Watch Video Guide
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function EpidemiologicalConditions() {
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

  const getRiskColor = (risk: string) => {
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

export function FarmWorkerDashboard({ onNavigate, onLogout, userName, workerName, userRole, tasks, onTaskUpdate }: FarmWorkerDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-25 to-orange-25">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={logoImg} alt="Kavach Logo" className="h-12" />
            <div>
              <h1 className="text-3xl font-semibold text-primary">Farm Worker Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => onNavigate('compliance-dashboard')}
              variant="outline"
              className="gap-2"
              size="sm"
            >
              <BarChart3 className="w-4 h-4" />
              Compliance
            </Button>
            <AlertSystem userRole="Farm Worker" userName={userName} />
            <Badge variant="outline" className="px-3 py-1">
              <Users className="w-3 h-3 mr-1" />
              Farm Worker
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLogout}
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Top Row - Profile and Alerts Side by Side */}
      <div className="p-6 pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <WorkerProfileCard />
          </div>
          <div className="lg:col-span-3">
            <FarmTasksList tasks={tasks} workerName={workerName} onTaskUpdate={onTaskUpdate} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Farm Information */}
        <FarmInformation />

        {/* Biosecurity Protocol Library */}
        <BiosecurityProtocolLibrary />
        
        {/* Epidemiological Conditions */}
        <EpidemiologicalConditions />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="px-6 py-4 text-center text-sm text-gray-600">
          © 2025 Kavach | Powered by AI & IoT | Secure Farming, Healthy Animals
        </div>
      </footer>
    </div>
  );
}
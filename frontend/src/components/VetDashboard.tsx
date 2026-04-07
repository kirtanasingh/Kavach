import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  LayoutDashboard,
  AlertTriangle,
  Calendar,
  FileText,
  Activity,
  Pill,
  Users,
  BarChart3,
  Search,
  Bell,
  MessageSquare,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Edit
} from 'lucide-react';
import logoImg from 'figma:asset/28cc7f8b67ba61bb13e03c30f73fd05e9d3d8a2c.png';

interface VetDashboardProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName: string;
  userEmail?: string;
}

export function VetDashboard({ onNavigate, onLogout, userName, userEmail }: VetDashboardProps) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [unreadNotifications] = useState(7);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [selectedVLM, setSelectedVLM] = useState<number | null>(null);
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [showCreatePrescription, setShowCreatePrescription] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'active' | 'resolved'>('active');
  const [contentFade, setContentFade] = useState(true);
  const [bellShake, setBellShake] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [vlmQueue, setVlmQueue] = useState<any[]>([]);
  
  // Count-up animation for metrics
  const [animatedStats, setAnimatedStats] = useState({
    activeCases: 0,
    pendingReviews: 0,
    appointmentsToday: 0,
    farmsUnderCare: 0
  });

  // Mock stats data
  const stats = {
    activeCases: 23,
    pendingReviews: 8,
    appointmentsToday: 6,
    farmsUnderCare: 47
  };

  // Fetch VLM Queue from backend
  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    fetch(`${API_BASE}/detections?status=pending_review`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setVlmQueue)
      .catch(() => {
        // Fallback to mock data
        setVlmQueue([
          { id: 1, farm: 'Green Valley Poultry', farmer: 'Rajesh Patel', animal: 'Chicken #1923', uploadDate: '4 Apr 2026 10:15 AM', aiDiagnosis: 'Newcastle Disease', disease: 'Newcastle Disease', confidence: 92, status: 'Pending Review', priority: 'High', thumbnail: '🐔', species: 'Poultry' },
          { id: 2, farm: 'Sunrise Pig Farm', farmer: 'Priya Sharma', animal: 'Pig #2847', uploadDate: '4 Apr 2026 9:30 AM', aiDiagnosis: 'Swine Flu', disease: 'Swine Flu', confidence: 87, status: 'Pending Review', priority: 'High', thumbnail: '🐷', species: 'Pig' },
          { id: 3, farm: 'Happy Hens Farm', farmer: 'Amit Kumar', animal: 'Chicken #3452', uploadDate: '3 Apr 2026 4:20 PM', aiDiagnosis: 'Avian Influenza', disease: 'Avian Influenza', confidence: 78, status: 'Under Review', priority: 'Critical', thumbnail: '🐔', species: 'Poultry' },
          { id: 4, farm: 'Silver Oak Farms', farmer: 'Sunita Desai', animal: 'Pig #2718', uploadDate: '3 Apr 2026 2:10 PM', aiDiagnosis: 'Skin Lesions', disease: 'Skin Lesions', confidence: 65, status: 'Pending Review', priority: 'Medium', thumbnail: '🐷', species: 'Pig' },
        ]);
      });
  }, []);

  // Count-up animation effect
  useEffect(() => {
    const duration = 600;
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedStats({
        activeCases: Math.floor(stats.activeCases * easeOutCubic),
        pendingReviews: Math.floor(stats.pendingReviews * easeOutCubic),
        appointmentsToday: Math.floor(stats.appointmentsToday * easeOutCubic),
        farmsUnderCare: Math.floor(stats.farmsUnderCare * easeOutCubic)
      });
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats(stats);
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, []);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'cases', label: 'Cases', icon: FileText },
    { id: 'vlm-review', label: 'VLM Review', icon: Activity },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'farmers', label: 'Farmers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // Critical alerts data
  const criticalAlerts: any[] = [
    { id: 1, farm: 'Green Valley Poultry', disease: 'Newcastle Disease', severity: 'Critical', time: '2 hours ago', location: 'Pune', status: 'Active' },
    { id: 2, farm: 'Sunrise Pig Farm', disease: 'Swine Flu', severity: 'High', time: '5 hours ago', location: 'Mumbai', status: 'Active' },
    { id: 3, farm: 'Happy Hens Farm', disease: 'Avian Influenza', severity: 'Critical', time: '1 day ago', location: 'Nashik', status: 'Monitoring' },
  ];

  // Active cases data
  const activeCases: any[] = [
    { id: 1, farmName: 'Green Valley Poultry', farm: 'Green Valley Poultry', farmerName: 'Rajesh Patel', animal: 'Chicken #1923', condition: 'Newcastle Disease', disease: 'Newcastle Disease', status: 'Critical', lastUpdate: '2 hours ago', opened: '2 Apr 2026', nextVisit: 'Today 3:00 PM' },
    { id: 2, farmName: 'Sunrise Pig Farm', farm: 'Sunrise Pig Farm', farmerName: 'Priya Sharma', animal: 'Pig #2847', condition: 'Swine Flu Symptoms', disease: 'Swine Flu', status: 'Under Treatment', lastUpdate: '5 hours ago', opened: '1 Apr 2026', nextVisit: 'Tomorrow 10:00 AM' },
    { id: 3, farmName: 'Happy Hens Farm', farm: 'Happy Hens Farm', farmerName: 'Amit Kumar', animal: 'Chicken #3452', condition: 'Avian Influenza', disease: 'Avian Influenza', status: 'Monitoring', lastUpdate: '1 day ago', opened: '30 Mar 2026', nextVisit: 'Apr 6, 2:00 PM' },
    { id: 4, farmName: 'Silver Oak Farms', farm: 'Silver Oak Farms', farmerName: 'Sunita Desai', animal: 'Pig #2718', condition: 'Skin Lesions', disease: 'Skin Lesions', status: 'Stable', lastUpdate: '2 days ago', opened: '28 Mar 2026', nextVisit: 'Apr 8, 11:00 AM' },
  ];

  // Appointments timeline data
  const appointmentsToday: any[] = [
    { id: 1, time: '10:00 AM', farm: 'Green Valley Poultry', farmer: 'Rajesh Patel', type: 'Emergency Visit', status: 'Confirmed', location: 'Pune', distance: '5.2 km', duration: '30' },
    { id: 2, time: '11:30 AM', farm: 'Happy Hens Farm', farmer: 'Amit Kumar', type: 'Follow-up', status: 'Confirmed', location: 'Nashik', distance: '12 km', duration: '45' },
    { id: 3, time: '2:00 PM', farm: 'Sunrise Pig Farm', farmer: 'Priya Sharma', type: 'Routine Checkup', status: 'Pending', location: 'Mumbai', distance: '8.5 km', duration: '60' },
    { id: 4, time: '3:30 PM', farm: 'Silver Oak Farms', farmer: 'Sunita Desai', type: 'Vaccination', status: 'Confirmed', location: 'Pune', distance: '6.8 km', duration: '20' },
    { id: 5, time: '5:00 PM', farm: 'Blue Sky Poultry', farmer: 'Ravi Mehta', type: 'Consultation', status: 'Pending', location: 'Pune', distance: '4.3 km', duration: '30' },
  ];

  const handleVLMAccept = async (caseId: number) => {
    const token = localStorage.getItem('token') || '';
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    try {
      await fetch(`${API_BASE}/annotations/${caseId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          accepted: true, 
          vet_diagnosis: null
        })
      });
      // Remove from queue
      setVlmQueue(prev => prev.filter(item => item.id !== caseId));
    } catch (err) {
      alert('Failed to accept annotation. Please try again.');
    }
  };

  const handleVLMCorrect = async (caseId: number) => {
    const correctedDiagnosis = prompt('Enter corrected diagnosis:');
    if (!correctedDiagnosis) return;
    
    const token = localStorage.getItem('token') || '';
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    try {
      await fetch(`${API_BASE}/annotations/${caseId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          accepted: false, 
          vet_diagnosis: correctedDiagnosis
        })
      });
      // Remove from queue
      setVlmQueue(prev => prev.filter(item => item.id !== caseId));
    } catch (err) {
      alert('Failed to submit correction. Please try again.');
    }
  };

  // Recent prescriptions
  const recentPrescriptions: any[] = [
    { id: 1, farm: 'Green Valley Poultry', farmer: 'Rajesh Patel', animal: 'Chicken #1923', drug: 'Tetracycline HCl', dose: '10mg/kg', frequency: 'Twice daily', duration: '7 days', date: '4 Apr 2026', withdrawal: '14 days', status: 'Active', issued: '4 Apr 2026' },
    { id: 2, farm: 'Sunrise Pig Farm', farmer: 'Priya Sharma', animal: 'Pig #2847', drug: 'Oseltamivir', dose: '75mg', frequency: 'Once daily', duration: '5 days', date: '4 Apr 2026', withdrawal: '10 days', status: 'Active', issued: '4 Apr 2026' },
    { id: 3, farm: 'Silver Oak Farms', farmer: 'Sunita Desai', animal: 'Pig #2718', drug: 'Topical Antibiotic', dose: 'As needed', frequency: 'Twice daily', duration: '10 days', date: '3 Apr 2026', withdrawal: 'N/A', status: 'Completed', issued: '3 Apr 2026' },
  ];

  // AMR Risk Farms
  const amrRiskFarms: any[] = [
    { id: 1, farm: 'Green Valley Poultry', riskScore: 78, color: '#E8A838' },
    { id: 2, farm: 'Sunrise Pig Farm', riskScore: 65, color: '#4CAF7D' },
    { id: 3, farm: 'Happy Hens Farm', riskScore: 92, color: '#C0392B' },
    { id: 4, farm: 'Silver Oak Farms', riskScore: 45, color: '#4CAF7D' },
  ];

  const handleNavClick = (navId: string) => {
    setContentFade(false);
    setTimeout(() => {
      setActiveNav(navId);
      setContentFade(true);
    }, 150);
  };

  // Notification handler
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setBellShake(true);
      setTimeout(() => setBellShake(false), 400);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-[#C0392B] text-white';
      case 'moderate':
        return 'bg-[#E8A838] text-white';
      case 'low':
        return 'bg-[#4CAF7D] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'under treatment':
        return 'bg-[#E8A838] text-white';
      case 'monitoring':
        return 'bg-[#1B5E42] text-white';
      case 'recovery':
        return 'bg-[#4CAF7D] text-white';
      case 'active':
        return 'bg-[#4CAF7D] text-white';
      case 'fulfilled':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Active Cases</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeCases}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#1B5E42]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#1B5E42]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Pending Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#E8A838]/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#E8A838]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Appointments Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.appointmentsToday}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#4CAF7D]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#4CAF7D]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Farms Under Care</p>
                <p className="text-3xl font-bold text-gray-900">{stats.farmsUnderCare}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#1B5E42]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1B5E42]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-[65%_35%] gap-6">
        {/* Left Column - 65% */}
        <div className="space-y-6">
          {/* Critical Alerts */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse"></div>
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-[#F7F5F0] rounded-lg hover:shadow-md transition-shadow"
                  style={{ borderLeft: `4px solid ${alert.borderColor}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alert.farm}</p>
                      <p className="text-sm text-[#7A7A6E] mt-1">{alert.disease}</p>
                      <p className="text-xs text-[#7A7A6E] mt-1">{alert.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getSeverityStyle(alert.severity)} px-3 py-1 text-xs rounded-full`}>
                        {alert.severity}
                      </Badge>
                      <Button size="sm" variant="outline" className="border-[#1B5E42] text-[#1B5E42] hover:bg-[#1B5E42] hover:text-white">
                        Respond
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Cases Table */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="w-5 h-5 text-[#1B5E42]" />
                Active Cases
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F7F5F0]">
                    <TableHead className="text-[#7A7A6E]">Farm</TableHead>
                    <TableHead className="text-[#7A7A6E]">Disease</TableHead>
                    <TableHead className="text-[#7A7A6E]">Opened</TableHead>
                    <TableHead className="text-[#7A7A6E]">Last Update</TableHead>
                    <TableHead className="text-[#7A7A6E]">Status</TableHead>
                    <TableHead className="text-[#7A7A6E]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeCases.map((caseItem) => (
                    <TableRow key={caseItem.id} className="hover:bg-[#F7F5F0]">
                      <TableCell className="font-medium text-gray-900">{caseItem.farm}</TableCell>
                      <TableCell className="text-[#7A7A6E]">{caseItem.disease}</TableCell>
                      <TableCell className="text-[#7A7A6E]">{caseItem.opened}</TableCell>
                      <TableCell className="text-[#7A7A6E]">{caseItem.lastUpdate}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusStyle(caseItem.status)} px-2 py-1 text-xs rounded-full`}>
                          {caseItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-[#1B5E42] hover:bg-[#F7F5F0]">
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[#1B5E42] hover:bg-[#F7F5F0]">
                            Message
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Appointment Timeline */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-5 h-5 text-[#1B5E42]" />
                Appointment Timeline - Today
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-0 top-0 bottom-0 w-full h-2 bg-[#E5E3DC] rounded-full"></div>
                
                {/* Current Time Indicator */}
                <div className="absolute left-[35%] top-0 w-3 h-3 rounded-full bg-[#1B5E42] -translate-y-[2px]"></div>

                {/* Appointments */}
                <div className="relative pt-8 space-y-4">
                  {appointmentsToday.map((appointment, idx) => (
                    <div key={appointment.id} className="flex items-start gap-4">
                      <div className="w-20 text-sm font-medium text-[#7A7A6E]">{appointment.time}</div>
                      <div className="flex-1 p-4 bg-[#4CAF7D]/10 rounded-lg border border-[#4CAF7D]/30">
                        <p className="font-medium text-gray-900">{appointment.farm}</p>
                        <p className="text-sm text-[#7A7A6E] mt-1">{appointment.duration} minutes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 35% */}
        <div className="space-y-6">
          {/* VLM Review Queue */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center justify-between text-gray-900">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#1B5E42]" />
                  VLM Review Queue
                </div>
                <Badge className="bg-[#E8A838] text-white px-2 py-1 text-xs rounded-full">
                  {stats.pendingReviews}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {vlmQueue.map((item) => (
                <div key={item.id} className="p-3 bg-[#F7F5F0] rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                      {item.thumbnail}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.farm}</p>
                      <p className="text-xs text-[#7A7A6E]">{item.species}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-2">{item.disease}</p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-[#7A7A6E] mb-1">
                      <span>Confidence</span>
                      <span>{item.confidence}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E5E3DC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1B5E42] rounded-full"
                        style={{ width: `${item.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleVLMAccept(item.id)}
                      className="flex-1 bg-[#4CAF7D] hover:bg-[#3D9B68] text-white text-xs"
                    >
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleVLMCorrect(item.id)}
                      variant="outline" 
                      className="flex-1 border-[#C0392B] text-[#C0392B] hover:bg-[#C0392B] hover:text-white text-xs"
                    >
                      Correct
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Prescription Summary */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <Pill className="w-5 h-5 text-[#1B5E42]" />
                Prescription Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2 mb-4">
                {recentPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="flex items-center justify-between py-2 border-b border-[#E5E3DC] last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{prescription.farm}</p>
                      <p className="text-xs text-[#7A7A6E]">{prescription.drug} • {prescription.issued}</p>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        prescription.status === 'active' ? 'bg-[#4CAF7D]' : 'bg-gray-400'
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
              <Button className="w-full bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg">
                Create Prescription
              </Button>
            </CardContent>
          </Card>

          {/* AMR Risk Overview */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <AlertCircle className="w-5 h-5 text-[#1B5E42]" />
                AMR Risk Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {amrRiskFarms.map((farm, idx) => (
                <div key={farm.id} className="flex items-center gap-3">
                  <div className="text-sm font-bold text-[#7A7A6E] w-6">{idx + 1}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">{farm.farm}</p>
                    <div className="w-full h-2 bg-[#E5E3DC] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${farm.riskScore}%`,
                          backgroundColor: farm.color
                        }}
                      ></div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[#1B5E42] text-xs">
                    View
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return renderDashboard();
      case 'alerts':
        return <div className="text-gray-900">Alerts content coming soon...</div>;
      case 'appointments':
        return <div className="text-gray-900">Appointments content coming soon...</div>;
      case 'cases':
        return <div className="text-gray-900">Cases content coming soon...</div>;
      case 'vlm-review':
        return <div className="text-gray-900">VLM Review content coming soon...</div>;
      case 'prescriptions':
        return <div className="text-gray-900">Prescriptions content coming soon...</div>;
      case 'farmers':
        return <div className="text-gray-900">Farmers content coming soon...</div>;
      case 'analytics':
        return <div className="text-gray-900">Analytics content coming soon...</div>;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E3DC] flex flex-col">
        <div className="p-6 border-b border-[#E5E3DC]">
          <img src={logoImg} alt="Kavach Logo" className="h-10" />
          <p className="text-xs text-[#7A7A6E] mt-2">Veterinary Care Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-all ${
                  isActive
                    ? 'bg-[#1B5E42] text-white'
                    : 'text-[#7A7A6E] hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E3DC]">
          <Button 
            onClick={onLogout} 
            variant="outline" 
            className="w-full text-[#7A7A6E] border-[#E5E3DC] hover:bg-gray-50"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#E5E3DC] px-8 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Veterinarian Portal</h1>
            
            <div className="flex items-center gap-6">
              <button className="text-[#7A7A6E] hover:text-gray-900 transition-colors">
                <Search className="w-5 h-5" />
              </button>
              
              <button className="relative text-[#7A7A6E] hover:text-gray-900 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-[#C0392B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1B5E42] text-white flex items-center justify-center font-medium">
                  {userName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-[#7A7A6E]">Licensed Veterinarian</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  fetchVetAnalytics,
  fetchVetCases,
  fetchVetDetectionQueue,
  submitVetDetectionReview,
  type AnalyticsPayload,
  type VetCaseItem,
  type VetDetectionItem,
} from '../services/detectionRecordsService';

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
  const [vlmQueue, setVlmQueue] = useState<VetDetectionItem[]>([]);
  const [cases, setCases] = useState<VetCaseItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPayload>({
    overall_reviews: [],
    by_species: [],
    trend: [],
  });
  const [loadingData, setLoadingData] = useState(false);
  
  // Count-up animation for metrics
  const [animatedStats, setAnimatedStats] = useState({
    activeCases: 0,
    pendingReviews: 0,
    appointmentsToday: 0,
    farmsUnderCare: 0
  });

  const loadVetData = async () => {
    setLoadingData(true);
    try {
      const [queueRows, caseRows, analyticsRows] = await Promise.all([
        fetchVetDetectionQueue('pending_review'),
        fetchVetCases(),
        fetchVetAnalytics(),
      ]);
      setVlmQueue(queueRows);
      setCases(caseRows);
      setAnalytics(analyticsRows);
    } catch {
      setVlmQueue([]);
      setCases([]);
      setAnalytics({ overall_reviews: [], by_species: [], trend: [] });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadVetData();
  }, []);

  const stats = {
    activeCases: cases.filter((item) => item.status !== 'closed').length,
    pendingReviews: vlmQueue.length,
    appointmentsToday: 6,
    farmsUnderCare: new Set(cases.map((c) => c.farmer_name || 'Unknown')).size,
  };

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

  const activeCases = cases.filter((item) => item.status !== 'closed');

  // Appointments timeline data
  const appointmentsToday: any[] = [
    { id: 1, time: '10:00 AM', farm: 'Green Valley Poultry', farmer: 'Rajesh Patel', type: 'Emergency Visit', status: 'Confirmed', location: 'Pune', distance: '5.2 km', duration: '30' },
    { id: 2, time: '11:30 AM', farm: 'Happy Hens Farm', farmer: 'Amit Kumar', type: 'Follow-up', status: 'Confirmed', location: 'Nashik', distance: '12 km', duration: '45' },
    { id: 3, time: '2:00 PM', farm: 'Sunrise Pig Farm', farmer: 'Priya Sharma', type: 'Routine Checkup', status: 'Pending', location: 'Mumbai', distance: '8.5 km', duration: '60' },
    { id: 4, time: '3:30 PM', farm: 'Silver Oak Farms', farmer: 'Sunita Desai', type: 'Vaccination', status: 'Confirmed', location: 'Pune', distance: '6.8 km', duration: '20' },
    { id: 5, time: '5:00 PM', farm: 'Blue Sky Poultry', farmer: 'Ravi Mehta', type: 'Consultation', status: 'Pending', location: 'Pune', distance: '4.3 km', duration: '30' },
  ];

  const handleVLMAccept = async (detectionId: number) => {
    try {
      await submitVetDetectionReview(detectionId, 'safe');
      setVlmQueue((prev) => prev.filter((item) => item.detection_id !== detectionId));
      await loadVetData();
    } catch {
      alert('Failed to save safe review. Please try again.');
    }
  };

  const handleVLMCorrect = async (detectionId: number) => {
    const correctedDiagnosis = prompt('Enter corrected diagnosis:');
    if (!correctedDiagnosis) return;

    try {
      await submitVetDetectionReview(detectionId, 'not_safe', correctedDiagnosis);
      setVlmQueue((prev) => prev.filter((item) => item.detection_id !== detectionId));
      await loadVetData();
    } catch {
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
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - 65% */}
        <div className="space-y-6 xl:col-span-2">
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
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[760px]">
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
                      <TableCell className="font-medium text-gray-900">{caseItem.farmer_name || 'Unknown Farm'}</TableCell>
                      <TableCell className="text-[#7A7A6E]">{caseItem.predicted_label}</TableCell>
                      <TableCell className="text-[#7A7A6E]">{new Date(caseItem.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-[#7A7A6E]">{new Date(caseItem.updated_at).toLocaleString()}</TableCell>
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
        <div className="space-y-6 xl:col-span-1">
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
              {loadingData && <p className="text-sm text-[#7A7A6E]">Loading reviews...</p>}
              {!loadingData && vlmQueue.length === 0 && <p className="text-sm text-[#7A7A6E]">No detections pending review.</p>}
              {vlmQueue.map((item) => (
                <div key={item.detection_id} className="p-3 bg-[#F7F5F0] rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                      {item.species === 'poultry' ? '🐔' : item.species === 'pig' ? '🐷' : '🐄'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.farmer_name || 'Unknown Farmer'}</p>
                      <p className="text-xs text-[#7A7A6E]">{item.species} • {item.animal_name || 'Unknown animal'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-2">{item.predicted_label}</p>
                  <p className="text-xs text-[#7A7A6E] mb-2">Review: {item.review_status || 'pending'}</p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-[#7A7A6E] mb-1">
                      <span>Confidence</span>
                      <span>{Math.round((item.confidence || 0) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E5E3DC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1B5E42] rounded-full"
                        style={{ width: `${Math.round((item.confidence || 0) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleVLMAccept(item.detection_id)}
                      className="flex-1 bg-[#4CAF7D] hover:bg-[#3D9B68] text-white text-xs"
                    >
                      Mark Safe
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleVLMCorrect(item.detection_id)}
                      variant="outline" 
                      className="flex-1 border-[#C0392B] text-[#C0392B] hover:bg-[#C0392B] hover:text-white text-xs"
                    >
                      Not Safe
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

  const renderVlmReview = () => (
    <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
      <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Activity className="w-5 h-5 text-[#1B5E42]" />
          VLM Review
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-[#F7F5F0]">
              <TableHead>Detection</TableHead>
              <TableHead>Species</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Review Status</TableHead>
              <TableHead>Case Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vlmQueue.map((item) => (
              <TableRow key={item.detection_id}>
                <TableCell className="font-medium">{item.predicted_label}</TableCell>
                <TableCell>{item.species}</TableCell>
                <TableCell>{Math.round((item.confidence || 0) * 100)}%</TableCell>
                <TableCell>{item.review_status || 'pending'}</TableCell>
                <TableCell>{item.case_status || 'open'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleVLMAccept(item.detection_id)} className="bg-[#4CAF7D] hover:bg-[#3D9B68] text-white">
                      Safe
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleVLMCorrect(item.detection_id)} className="border-[#C0392B] text-[#C0392B]">
                      Not Safe
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loadingData && vlmQueue.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#7A7A6E] py-8">
                  No pending detections for review.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderCases = () => (
    <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
      <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <FileText className="w-5 h-5 text-[#1B5E42]" />
          Cases
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-[#F7F5F0]">
              <TableHead>Case ID</TableHead>
              <TableHead>Disease</TableHead>
              <TableHead>Species</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">#{item.id}</TableCell>
                <TableCell>{item.predicted_label}</TableCell>
                <TableCell>{item.species}</TableCell>
                <TableCell>{item.review_status || 'pending'}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{new Date(item.updated_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!loadingData && cases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#7A7A6E] py-8">
                  No cases available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderAnalytics = () => {
    const normalize = (value: string | null | undefined) => (value || '').toLowerCase();
    const totalCases = Math.max(cases.length, 1);

    const isHealthyCase = (item: VetCaseItem) => {
      const review = normalize(item.review_status);
      const label = normalize(item.predicted_label);
      if (review === 'safe') {
        return true;
      }
      if (review === 'not_safe') {
        return false;
      }
      return label.includes('healthy');
    };

    const severityLevel = (item: VetCaseItem): 'Mild' | 'Moderate' | 'Severe' => {
      if (isHealthyCase(item)) {
        return 'Mild';
      }

      const confidence = Number(item.confidence || 0);
      const label = normalize(item.predicted_label);
      const highRiskPattern = /(foot_and_mouth|swinepox|lumpy|influenza|newcastle)/;

      if (confidence >= 0.85 || highRiskPattern.test(label)) {
        return 'Severe';
      }
      if (confidence >= 0.6) {
        return 'Moderate';
      }
      return 'Mild';
    };

    const healthyCount = cases.filter(isHealthyCase).length;
    const unhealthyCount = Math.max(cases.length - healthyCount, 0);

    const healthStatusData = [
      { name: 'Healthy', count: healthyCount, percentage: Math.round((healthyCount / totalCases) * 1000) / 10, color: '#4CAF7D' },
      { name: 'Unhealthy', count: unhealthyCount, percentage: Math.round((unhealthyCount / totalCases) * 1000) / 10, color: '#C0392B' },
    ];

    const severityBuckets = cases.reduce(
      (acc, item) => {
        const severity = severityLevel(item);
        acc[severity] += 1;
        return acc;
      },
      { Mild: 0, Moderate: 0, Severe: 0 }
    );

    const severityData = [
      {
        category: 'Mild',
        count: severityBuckets.Mild,
        percentage: Math.round((severityBuckets.Mild / totalCases) * 1000) / 10,
        fill: '#4CAF7D',
      },
      {
        category: 'Moderate',
        count: severityBuckets.Moderate,
        percentage: Math.round((severityBuckets.Moderate / totalCases) * 1000) / 10,
        fill: '#E8A838',
      },
      {
        category: 'Severe',
        count: severityBuckets.Severe,
        percentage: Math.round((severityBuckets.Severe / totalCases) * 1000) / 10,
        fill: '#C0392B',
      },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader>
              <CardTitle className="text-gray-900">Health Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthStatusData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={86}
                      paddingAngle={4}
                    >
                      {healthStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} cases`, name]} />
                    <Legend verticalAlign="bottom" height={30} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {healthStatusData.map((item) => (
                  <div key={item.name} className="rounded-xl border border-[#E5E3DC] p-3 bg-[#F7F5F0]">
                    <p className="text-xs text-[#7A7A6E]">{item.name}</p>
                    <p className="text-lg font-semibold text-gray-900">{item.percentage}%</p>
                    <p className="text-xs text-[#7A7A6E]">{item.count} cases</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader>
              <CardTitle className="text-gray-900">Severity Analysis</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} barCategoryGap={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEAE3" />
                  <XAxis dataKey="category" tick={{ fill: '#5F5F53', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#5F5F53', fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, _name: string, ctx: { payload?: { percentage?: number; category?: string } }) => {
                      const row = ctx?.payload;
                      return [`${value} cases (${row?.percentage || 0}%)`, row?.category || 'Severity'];
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {severityData.map((entry) => (
                      <Cell key={entry.category} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return renderDashboard();
      case 'alerts':
        return <div className="text-gray-900">Alerts content coming soon...</div>;
      case 'appointments':
        return <div className="text-gray-900">Appointments content coming soon...</div>;
      case 'cases':
        return renderCases();
      case 'vlm-review':
        return renderVlmReview();
      case 'prescriptions':
        return <div className="text-gray-900">Prescriptions content coming soon...</div>;
      case 'farmers':
        return <div className="text-gray-900">Farmers content coming soon...</div>;
      case 'analytics':
        return renderAnalytics();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex overflow-x-hidden">
      {/* Fixed Left Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E3DC] flex flex-col fixed h-screen">
        <div className="p-6 border-b border-[#E5E3DC]">
          <img src={logoImg} alt="Kavach Logo" className="h-10" />
          <p className="text-xs text-[#7A7A6E] mt-2">Veterinary Care Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
      <main className="flex-1 ml-64 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#E5E3DC] px-8 py-5 sticky top-0 z-10">
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
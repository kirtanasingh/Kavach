import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  LayoutDashboard,
  Search,
  Bell,
  LogOut,
  Activity,
  AlertTriangle,
  ClipboardList,
  Shield,
  FileText,
  AlertCircle,
  Upload,
  Phone,
  BarChart3,
  Download,
  Thermometer,
  Droplet,
  CloudRain,
  MapPin,
  User,
  Calendar,
  Plus,
  Filter,
  Image as ImageIcon,
  Eye,
  Edit,
  ChevronRight,
  Pill,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import logoImg from 'figma:asset/28cc7f8b67ba61bb13e03c30f73fd05e9d3d8a2c.png';
import { analyzeImage } from '../services/diseaseDetectionService';

const DETECTION_HISTORY_STORAGE_KEY = 'farmOwnerDetectionHistory';

type DetectionSeverity = 'High' | 'Medium' | 'Low' | 'Unknown';
type DetectionAnimalType = 'pig' | 'poultry' | 'cattle';

interface DetectionHistoryItem {
  id: string;
  disease: string;
  confidence: number;
  severity: DetectionSeverity;
  animalType: DetectionAnimalType;
  status: string;
  recommendation: string;
  image: string;
  date: string;
}

const mapSeverityToLabel = (severity?: string): DetectionSeverity => {
  switch ((severity ?? '').toLowerCase()) {
    case 'severe':
    case 'high':
    case 'critical':
      return 'High';
    case 'moderate':
    case 'medium':
      return 'Medium';
    case 'mild':
    case 'low':
      return 'Low';
    default:
      return 'Unknown';
  }
};

const loadDetectionHistory = (): DetectionHistoryItem[] => {
  try {
    const raw = localStorage.getItem(DETECTION_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

interface FarmOwnerDashboardProps {
  initialNav?: 'home' | 'detection' | 'tasks' | 'records' | 'alerts' | 'compliance' | 'reports';
  onNavigate?: (view: string) => void;
  onLogout?: () => void;
  userName?: string;
  userEmail?: string;
  tasks?: any[];
  onTaskUpdate?: (taskId: number, newStatus: any) => void;
  onAddTask?: (newTask: any) => void;
}

export default function FarmOwnerDashboard({ initialNav = 'home', onNavigate, onLogout, userName = '' }: FarmOwnerDashboardProps) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(initialNav);
  const [notificationCount] = useState(5);
  const [taskTab, setTaskTab] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [recordTab, setRecordTab] = useState<'animals' | 'treatments' | 'compliance'>('animals');
  const [alertFilter, setAlertFilter] = useState<'all' | 'outbreak' | 'vet' | 'system'>('all');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [animalType, setAnimalType] = useState<'Pig' | 'Poultry' | 'Cattle'>('Pig');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<DetectionHistoryItem[]>(() => loadDetectionHistory());
  const [historyAnimalFilter, setHistoryAnimalFilter] = useState<'all' | 'pig' | 'poultry' | 'cattle'>('all');
  const [historySeverityFilter, setHistorySeverityFilter] = useState<'all' | 'High' | 'Medium' | 'Low' | 'Unknown'>('all');

  useEffect(() => {
    setActiveNav(initialNav);
  }, [initialNav]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    localStorage.setItem(DETECTION_HISTORY_STORAGE_KEY, JSON.stringify(detectionHistory));
  }, [detectionHistory]);

  // Mock Data
  const stats = {
    totalAnimals: 2847,
    activeAlerts: 3,
    complianceRate: 94,
    pendingTasks: 12,
  };

  const todayTasks: any[] = [
    { id: 1, task: 'Clean Building A Shed', title: 'Clean Building A Shed', description: 'Thorough cleaning and disinfection of all surfaces', assignedTo: 'Ramesh Kumar', assignee: 'Ramesh Kumar', assigneeAvatar: 'RK', priority: 'High', due: '10:00 AM', dueDate: '10:00 AM', status: 'In Progress' },
    { id: 2, task: 'Vaccinate Batch #4', title: 'Vaccinate Batch #4', description: 'Administer Newcastle Disease vaccine to 500 birds', assignedTo: 'Priya Sharma', assignee: 'Priya Sharma', assigneeAvatar: 'PS', priority: 'High', due: '11:30 AM', dueDate: '11:30 AM', status: 'Pending' },
    { id: 3, task: 'Water Quality Check', title: 'Water Quality Check', description: 'Test pH and mineral levels in all water sources', assignedTo: 'Amit Patel', assignee: 'Amit Patel', assigneeAvatar: 'AP', priority: 'Medium', due: '2:00 PM', dueDate: '2:00 PM', status: 'Pending' },
    { id: 4, task: 'Feed Distribution - Evening', title: 'Feed Distribution - Evening', description: 'Distribute evening feed to all pig pens', assignedTo: 'Ramesh Kumar', assignee: 'Ramesh Kumar', assigneeAvatar: 'RK', priority: 'Medium', due: '5:00 PM', dueDate: '5:00 PM', status: 'Pending' },
  ];

  const upcomingTasks: any[] = [
    { id: 5, task: 'Monthly Health Checkup', title: 'Monthly Health Checkup', description: 'Comprehensive veterinary examination of all livestock', assignedTo: 'Dr. Mehta', assignee: 'Dr. Mehta', assigneeAvatar: 'DM', priority: 'High', due: 'Apr 8', dueDate: 'Apr 8', status: 'Scheduled' },
    { id: 6, task: 'Biosecurity Audit', title: 'Biosecurity Audit', description: 'Complete farm biosecurity protocol review', assignedTo: 'All Staff', assignee: 'All Staff', assigneeAvatar: 'AS', priority: 'Medium', due: 'Apr 10', dueDate: 'Apr 10', status: 'Scheduled' },
    { id: 7, task: 'Equipment Maintenance', title: 'Equipment Maintenance', description: 'Service and repair feeding systems', assignedTo: 'Amit Patel', assignee: 'Amit Patel', assigneeAvatar: 'AP', priority: 'Low', due: 'Apr 12', dueDate: 'Apr 12', status: 'Scheduled' },
  ];

  const completedTasks: any[] = [
    { id: 8, task: 'Morning Feed Distribution', title: 'Morning Feed Distribution', description: 'Completed morning feeding round for all animals', assignedTo: 'Ramesh Kumar', assignee: 'Ramesh Kumar', assigneeAvatar: 'RK', priority: 'High', due: 'Apr 4', dueDate: 'Apr 4', completedDate: 'Apr 4', status: 'Completed' },
    { id: 9, task: 'Facility Inspection', title: 'Facility Inspection', description: 'Routine inspection of all buildings and pens', assignedTo: 'Priya Sharma', assignee: 'Priya Sharma', assigneeAvatar: 'PS', priority: 'Medium', due: 'Apr 3', dueDate: 'Apr 3', completedDate: 'Apr 3', status: 'Completed' },
    { id: 10, task: 'Waste Disposal', title: 'Waste Disposal', description: 'Proper disposal of animal waste and bedding', assignedTo: 'Amit Patel', assignee: 'Amit Patel', assigneeAvatar: 'AP', priority: 'Low', due: 'Apr 3', dueDate: 'Apr 3', completedDate: 'Apr 3', status: 'Completed' },
  ];

  const animals: any[] = [
    { id: 'P2847', tag: 'P2847', species: 'Pig', type: 'Pig', breed: 'Large White', age: '6 months', status: 'Under Observation', health: 'Under Observation', lastCheckup: '2 hours ago', vaccinated: true },
    { id: 'C1923', tag: 'C1923', species: 'Chicken', type: 'Chicken', breed: 'Broiler', age: '8 weeks', status: 'Critical', health: 'Critical', lastCheckup: '5 hours ago', vaccinated: true },
    { id: 'P2718', tag: 'P2718', species: 'Pig', type: 'Pig', breed: 'Landrace', age: '4 months', status: 'Testing Required', health: 'Testing Required', lastCheckup: '1 day ago', vaccinated: true },
    { id: 'P2561', tag: 'P2561', species: 'Pig', type: 'Pig', breed: 'Duroc', age: '5 months', status: 'Healthy', health: 'Healthy', lastCheckup: '3 days ago', vaccinated: true },
    { id: 'C1847', tag: 'C1847', species: 'Chicken', type: 'Chicken', breed: 'Layer', age: '12 weeks', status: 'Healthy', health: 'Healthy', lastCheckup: '2 days ago', vaccinated: true },
  ];

  const treatments: any[] = [
    { id: 'T001', animal: 'Pig #2847', diagnosis: 'Swine Flu Symptoms', medication: 'Oseltamivir 75mg', vet: 'Dr. Rajesh Mehta', date: '4 Apr 2026', status: 'Active' },
    { id: 'T002', animal: 'Chicken #1923', diagnosis: 'Newcastle Disease', medication: 'Antibiotics + Isolation', vet: 'Dr. Anjali Singh', date: '4 Apr 2026', status: 'Monitoring' },
    { id: 'T003', animal: 'Pig #2718', diagnosis: 'Skin Lesions', medication: 'Topical Ointment', vet: 'Dr. Rajesh Mehta', date: '3 Apr 2026', status: 'Completed' },
  ];

  const complianceItems: any[] = [
    { item: 'Vaccination Records', status: 'Compliant', lastUpdate: '1 Apr 2026', nextDue: '1 Jul 2026' },
    { item: 'Biosecurity Protocols', status: 'Compliant', lastUpdate: '28 Mar 2026', nextDue: '28 Jun 2026' },
    { item: 'AMU Documentation', status: 'Compliant', lastUpdate: '2 Apr 2026', nextDue: '2 May 2026' },
    { item: 'Facility Inspection', status: 'Non-Compliant', lastUpdate: '15 Mar 2026', nextDue: '15 Apr 2026' },
  ];

  const alerts: any[] = [
    { id: 1, type: 'outbreak', title: 'Newcastle Disease Outbreak', description: 'Detected within 5km radius - 3 farms affected', location: 'Pune District', severity: 'Critical', timestamp: '5 hours ago' },
    { id: 2, type: 'vet', title: 'Vet Consultation Required', description: 'Pig #2847 requires immediate veterinary attention', animal: 'Pig #2847', severity: 'High', timestamp: '2 hours ago' },
    { id: 3, type: 'system', title: 'Compliance Deadline Approaching', description: 'Facility Inspection due in 11 days', severity: 'Medium', timestamp: '1 day ago' },
    { id: 4, type: 'outbreak', title: 'Avian Influenza Alert', description: 'State-wide monitoring activated', location: 'Maharashtra', severity: 'High', timestamp: '2 days ago' },
    { id: 5, type: 'system', title: 'Medication Stock Low', description: 'Oseltamivir supply below threshold', severity: 'Medium', timestamp: '3 days ago' },
  ];

  const diseaseAlerts: any[] = [
    { id: 1, disease: 'Newcastle Disease', animal: 'Chicken #1923', risk: 'High', severity: 'Critical', cases: 8, trend: 'up', distance: '5 km', affected: '12 birds', status: 'Active' },
    { id: 2, disease: 'Avian Influenza', animal: 'Chicken Flock B', risk: 'Medium', severity: 'High', cases: 3, trend: 'stable', distance: '12 km', affected: '8 birds', status: 'Monitoring' },
    { id: 3, disease: 'Swine Flu', animal: 'Pig #2847', risk: 'Low', severity: 'Medium', cases: 1, trend: 'down', distance: '18 km', affected: '1 pig', status: 'Testing' },
  ];

  const nearbyRisks: any[] = [
    { farm: 'Green Valley Poultry', disease: 'Newcastle Disease', distance: '5.2 km', severity: 'Critical', status: 'Active' },
    { farm: 'Sunrise Farms', disease: 'Avian Influenza', distance: '12.8 km', severity: 'High', status: 'Monitoring' },
    { farm: 'Happy Pigs Farm', disease: 'Swine Flu', distance: '18.3 km', severity: 'Low', status: 'Confirmed' },
  ];

  const environmentalData = {
    temperature: 28,
    humidity: 65,
    rainfall: 12,
  };

  const complianceData = {
    compliant: 23,
    nonCompliant: 4,
    total: 27,
    percentage: 85,
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-[#C0392B] text-white';
      case 'high':
        return 'bg-[#E8A838] text-white';
      case 'medium':
        return 'bg-[#E8A838] text-white';
      case 'low':
        return 'bg-[#4CAF7D] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusStyle = (status: string) => {
    if (!status) return 'bg-gray-500 text-white';
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-[#C0392B] text-white';
      case 'monitoring':
        return 'bg-[#E8A838] text-white';
      case 'testing':
      case 'pending':
        return 'bg-[#E8A838] text-white';
      case 'done':
      case 'completed':
        return 'bg-[#4CAF7D] text-white';
      case 'healthy':
        return 'bg-[#4CAF7D] text-white';
      case 'under observation':
      case 'testing required':
        return 'bg-[#E8A838] text-white';
      case 'critical':
        return 'bg-[#C0392B] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-[#C0392B] text-white';
      case 'medium':
        return 'bg-[#E8A838] text-white';
      case 'low':
        return 'bg-[#4CAF7D] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleNavClick = (navId: string) => {
    if (navId === 'detection') {
      // Keep detection tab responsive even when already on /dashboard/vlm.
      setActiveNav('detection');
      navigate('/dashboard/vlm');
      return;
    }
    setActiveNav(navId);
  };

  const handleAnalyze = async () => {
    console.log('BUTTON CLICKED');

    if (!file) {
      alert('Upload image first');
      return;
    }

    setLoading(true);
    setAnalysisError(null);

    try {
      const result = await analyzeImage(file, animalType);
      console.log('API RESPONSE RECEIVED', result);
      setAnalysisResult(result);

      const historyItem: DetectionHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        disease: result.disease || 'Unknown',
        confidence: Math.round((result.confidence ?? 0) * 100),
        severity: mapSeverityToLabel(result.severity),
        animalType: animalType.toLowerCase() as DetectionAnimalType,
        status: result.requires_vet ? 'Pending' : 'Completed',
        recommendation: result.recommendation ?? '',
        image: animalType === 'Pig' ? '🐷' : animalType === 'Poultry' ? '🐔' : '🐄',
        date: new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setDetectionHistory((prev) => [historyItem, ...prev]);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err?.message ?? 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (selected: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(selected);
    setAnalysisResult(null);
    setAnalysisError(null);

    if (selected && !selected.type.startsWith('image/')) {
      setFile(null);
      setPreviewUrl(null);
      setAnalysisError('Invalid image: please upload a pig, poultry, or cattle photo.');
      return;
    }
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
    console.log('FILE SELECTED', selected?.name ?? 'none');
  };

  const handleScanAnother = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setLoading(false);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setDetectionHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    setDetectionHistory([]);
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'detection', label: 'Disease Detection', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const filteredAlerts = alertFilter === 'all' ? alerts : alerts.filter(a => a.type === alertFilter);
  const currentTasks = taskTab === 'today' ? todayTasks : taskTab === 'upcoming' ? upcomingTasks : completedTasks;
  const filteredDetectionHistory = detectionHistory.filter((item) => {
    const animalTypeMatch = historyAnimalFilter === 'all' || item.animalType === historyAnimalFilter;
    const severityMatch = historySeverityFilter === 'all' || item.severity === historySeverityFilter;
    return animalTypeMatch && severityMatch;
  });

  // Render content based on active navigation
  const renderContent = () => {
    switch (activeNav) {
      case 'home':
        return renderHomeScreen();
      case 'detection':
        return renderDetectionScreen();
      case 'tasks':
        return renderTasksScreen();
      case 'records':
        return renderRecordsScreen();
      case 'alerts':
        return renderAlertsScreen();
      case 'compliance':
        return null;
      case 'reports':
        return null;
      default:
        return renderHomeScreen();
    }
  };

  const renderHomeScreen = () => (
    <>
      {/* Greeting */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{userName ? `Good Morning, ${userName.split(' ')[0]}! 👋` : 'Good Morning! 👋'}</h3>
        <p className="text-sm text-[#7A7A6E] mt-1">Here's what's happening on your farm today</p>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Total Animals</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAnimals > 0 ? stats.totalAnimals : '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#1B5E42]/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#1B5E42]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Active Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeAlerts > 0 ? stats.activeAlerts : '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#C0392B]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#C0392B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Compliance Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.complianceRate > 0 ? `${stats.complianceRate}%` : '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#1B5E42]/10 flex items-center justify-between">
                <Shield className="w-6 h-6 text-[#1B5E42]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Pending Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingTasks > 0 ? stats.pendingTasks : '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#E8A838]/10 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-[#E8A838]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-[65%_35%] gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Disease Detection Upload */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Activity className="w-5 h-5 text-[#1B5E42]" />
                Disease Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="border-2 border-dashed border-[#4CAF7D]/50 bg-[#F7F5F0] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#E5E3DC]/30 transition-colors">
                <div className="w-16 h-16 rounded-full bg-[#1B5E42]/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-[#1B5E42]" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Upload Image/Video</p>
                <p className="text-xs text-[#7A7A6E]">JPG, PNG, MP4 • Max 25MB</p>
              </div>
              <Button onClick={() => navigate('/dashboard/vlm')} className="w-full bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg py-3">
                Start Detection
              </Button>

              {/* Recent Detections */}
              <div className="pt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Recent Detections</h4>
                {detectionHistory.length === 0 && (
                  <div className="p-3 bg-[#F7F5F0] rounded-lg text-xs text-[#7A7A6E]">
                    No detections yet. Run a scan to populate history.
                  </div>
                )}
                {detectionHistory.slice(0, 2).map(detection => (
                  <div key={detection.id} className="flex items-center gap-3 p-3 bg-[#F7F5F0] rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                      {detection.image}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{detection.disease}</p>
                      <p className="text-xs text-[#7A7A6E]">{detection.date} • {detection.confidence}% confidence</p>
                    </div>
                    <Badge className={`${getSeverityStyle(detection.severity)} px-2 py-1 text-xs rounded-full`}>
                      {detection.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center justify-between text-gray-900">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#1B5E42]" />
                  Today's Tasks
                </div>
                <Button variant="ghost" size="sm" className="text-[#1B5E42]" onClick={() => setActiveNav('tasks')}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {todayTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-[#F7F5F0] rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                      <div className="flex items-center gap-4 text-xs text-[#7A7A6E]">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assignee}
                        </span>
                        <Badge className={`${getPriorityStyle(task.priority)} px-2 py-0.5 text-xs rounded-full`}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#1B5E42]">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Disease Alerts Feed */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <AlertCircle className="w-5 h-5 text-[#C0392B]" />
                Disease Alerts Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F7F5F0]">
                    <TableHead className="text-[#7A7A6E]">Disease</TableHead>
                    <TableHead className="text-[#7A7A6E]">Animal</TableHead>
                    <TableHead className="text-[#7A7A6E]">Severity</TableHead>
                    <TableHead className="text-[#7A7A6E]">Affected</TableHead>
                    <TableHead className="text-[#7A7A6E]">Status</TableHead>
                    <TableHead className="text-[#7A7A6E]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diseaseAlerts.map(alert => (
                    <TableRow key={alert.id} className="hover:bg-[#F7F5F0]">
                      <TableCell className="font-medium text-gray-900">{alert.disease}</TableCell>
                      <TableCell className="text-[#7A7A6E]">{alert.animal}</TableCell>
                      <TableCell>
                        <Badge className={`${getSeverityStyle(alert.severity)} px-2 py-1 text-xs rounded-full`}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-900">{alert.affected}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusStyle(alert.status)} px-2 py-1 text-xs rounded-full`}>
                          {alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-[#1B5E42] hover:bg-[#F7F5F0]">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <Activity className="w-5 h-5 text-[#1B5E42]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button className="w-full justify-start bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg">
                <Phone className="w-4 h-4 mr-2" />
                Contact Vet
              </Button>
              <Button className="w-full justify-start bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg">
                <FileText className="w-4 h-4 mr-2" />
                View Reports
              </Button>
              <Button className="w-full justify-start bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg">
                <Shield className="w-4 h-4 mr-2" />
                Compliance Dashboard
              </Button>
              <Button variant="outline" className="w-full justify-start border-[#E5E3DC] text-[#7A7A6E] hover:bg-[#F7F5F0] rounded-lg">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>

          {/* Nearby Risk Overview */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <MapPin className="w-5 h-5 text-[#1B5E42]" />
                Nearby Risk Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {nearbyRisks.map((farm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#F7F5F0] rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{farm.farm}</p>
                      <p className="text-xs text-[#7A7A6E]">{farm.distance} away</p>
                    </div>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: farm.color }}></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Environmental Conditions */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <CloudRain className="w-5 h-5 text-[#1B5E42]" />
                Environmental Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#E8A838]/10 flex items-center justify-center">
                      <Thermometer className="w-4 h-4 text-[#E8A838]" />
                    </div>
                    <span className="text-sm text-[#7A7A6E]">Temperature</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{environmentalData.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1B5E42]/10 flex items-center justify-center">
                      <Droplet className="w-4 h-4 text-[#1B5E42]" />
                    </div>
                    <span className="text-sm text-[#7A7A6E]">Humidity</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{environmentalData.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1B5E42]/10 flex items-center justify-center">
                      <CloudRain className="w-4 h-4 text-[#1B5E42]" />
                    </div>
                    <span className="text-sm text-[#7A7A6E]">Rainfall (7d)</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{environmentalData.rainfall}mm</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Summary */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <Shield className="w-5 h-5 text-[#1B5E42]" />
                Compliance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#7A7A6E]">Overall Compliance</span>
                  <span className="font-bold text-gray-900">{complianceData.percentage}%</span>
                </div>
                <div className="w-full h-3 bg-[#F7F5F0] rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div className="bg-[#1B5E42]" style={{ width: `${(complianceData.compliant / complianceData.total) * 100}%` }}></div>
                    <div className="bg-[#C0392B]" style={{ width: `${(complianceData.nonCompliant / complianceData.total) * 100}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 bg-[#F7F5F0] rounded-lg">
                    <p className="text-2xl font-bold text-[#1B5E42]">{complianceData.compliant}</p>
                    <p className="text-xs text-[#7A7A6E] mt-1">Compliant</p>
                  </div>
                  <div className="text-center p-3 bg-[#F7F5F0] rounded-lg">
                    <p className="text-2xl font-bold text-[#C0392B]">{complianceData.nonCompliant}</p>
                    <p className="text-xs text-[#7A7A6E] mt-1">Non-Compliant</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );

  const renderDetectionScreen = () => (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Activity className="w-5 h-5 text-[#1B5E42]" />
            Disease Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">Select Animal Type</label>
              <select
                value={animalType}
                onChange={(e) => setAnimalType(e.target.value as 'Pig' | 'Poultry' | 'Cattle')}
                className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC]"
              >
                <option value="Pig">Pig</option>
                <option value="Poultry">Poultry</option>
                <option value="Cattle">Cattle</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-[#4CAF7D]/50 bg-[#F7F5F0] rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-[#E5E3DC]/30 transition-colors">
              <div className="w-20 h-20 rounded-full bg-[#1B5E42]/10 flex items-center justify-center mb-4">
                <Upload className="w-10 h-10 text-[#1B5E42]" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Upload Image</p>
              <p className="text-sm text-[#7A7A6E] mb-4">Choose an animal image to analyze</p>
              <input
                id="detection-image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="mb-3"
                onClick={() => document.getElementById('detection-image-upload')?.click()}
              >
                Upload Image
              </Button>
              {file && <p className="text-xs text-[#1B5E42] mt-2">Selected: {file.name}</p>}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Uploaded preview"
                  className="mt-3 w-full max-w-sm max-h-64 object-cover rounded-lg border border-[#E5E3DC]"
                />
              )}
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full mt-2 bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg py-3 text-base"
            >
              {loading ? 'Analyzing...' : 'Start Analyzing'}
            </Button>

            {analysisError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {analysisError}
              </div>
            )}

            {analysisResult && (
              <div className="p-4 rounded-lg bg-[#F7F5F0] border border-[#E5E3DC]">
                <p className="text-sm text-gray-700"><span className="font-semibold">Disease:</span> {analysisResult.disease}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Confidence:</span> {Math.round((analysisResult.confidence ?? 0) * 100)}%</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Severity:</span> {analysisResult.severity}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Recommendation:</span> {analysisResult.recommendation}</p>
                <Button
                  onClick={handleScanAnother}
                  variant="outline"
                  className="mt-4"
                >
                  Scan Another Image
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detection History */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <div className="flex flex-col gap-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FileText className="w-5 h-5 text-[#1B5E42]" />
              Detection History
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#7A7A6E]" />
                <select
                  value={historyAnimalFilter}
                  onChange={(e) => setHistoryAnimalFilter(e.target.value as 'all' | 'pig' | 'poultry' | 'cattle')}
                  className="h-9 px-2 rounded-lg border border-[#E5E3DC] text-sm"
                >
                  <option value="all">All Animals</option>
                  <option value="pig">Pig</option>
                  <option value="poultry">Poultry</option>
                  <option value="cattle">Cattle</option>
                </select>
              </div>
              <select
                value={historySeverityFilter}
                onChange={(e) => setHistorySeverityFilter(e.target.value as 'all' | 'High' | 'Medium' | 'Low' | 'Unknown')}
                className="h-9 px-2 rounded-lg border border-[#E5E3DC] text-sm"
              >
                <option value="all">All Severity</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Unknown">Unknown</option>
              </select>
              <Button
                variant="outline"
                className="h-9"
                disabled={detectionHistory.length === 0}
                onClick={handleClearHistory}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear History
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredDetectionHistory.length === 0 && (
              <div className="p-4 bg-[#F7F5F0] rounded-xl text-sm text-[#7A7A6E]">
                No detection records match your filter.
              </div>
            )}
            {filteredDetectionHistory.map(detection => (
              <div key={detection.id} className="p-4 bg-[#F7F5F0] rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
                    {detection.image}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{detection.disease}</p>
                        <p className="text-xs text-[#7A7A6E] mt-1">Scanned on {detection.date} ({detection.animalType})</p>
                      </div>
                      <Badge className={`${getSeverityStyle(detection.severity)} px-3 py-1 text-xs rounded-full`}>
                        {detection.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-[#7A7A6E]">Confidence: </span>
                        <span className="font-medium text-gray-900">{detection.confidence}%</span>
                      </div>
                      <div>
                        <span className="text-[#7A7A6E]">Status: </span>
                        <Badge className={`${getStatusStyle(detection.status)} px-2 py-0.5 text-xs rounded-full ml-1`}>
                          {detection.status}
                        </Badge>
                      </div>
                    </div>
                    {detection.recommendation && (
                      <div className="mt-2 p-2 bg-white rounded-lg text-xs text-[#7A7A6E]">
                        <span className="font-medium text-gray-900">Recommendation:</span> {detection.recommendation}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#C0392B] hover:text-[#C0392B]"
                    onClick={() => handleDeleteHistoryItem(detection.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTasksScreen = () => (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <ClipboardList className="w-5 h-5 text-[#1B5E42]" />
              Task Management
            </CardTitle>
            <Button className="bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant={taskTab === 'today' ? 'default' : 'ghost'}
              className={taskTab === 'today' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
              onClick={() => setTaskTab('today')}
            >
              Today
            </Button>
            <Button
              variant={taskTab === 'upcoming' ? 'default' : 'ghost'}
              className={taskTab === 'upcoming' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
              onClick={() => setTaskTab('upcoming')}
            >
              Upcoming
            </Button>
            <Button
              variant={taskTab === 'completed' ? 'default' : 'ghost'}
              className={taskTab === 'completed' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
              onClick={() => setTaskTab('completed')}
            >
              Completed
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {currentTasks.map(task => (
              <div key={task.id} className="p-5 bg-[#F7F5F0] rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                    <p className="text-sm text-[#7A7A6E]">{task.description}</p>
                  </div>
                  <Badge className={`${getPriorityStyle(task.priority)} px-3 py-1 text-xs rounded-full`}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1B5E42] flex items-center justify-center text-white text-xs font-medium">
                        {task.assigneeAvatar}
                      </div>
                      <span className="text-[#7A7A6E]">{task.assignee}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#7A7A6E]">
                      <Calendar className="w-4 h-4" />
                      {task.completedDate || task.dueDate}
                    </div>
                    <Badge className={`${getStatusStyle(task.status)} px-2 py-1 text-xs rounded-full`}>
                      {task.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[#1B5E42]">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecordsScreen = () => (
    <div className="space-y-6">
      {/* Header with Sub-tabs */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <FileText className="w-5 h-5 text-[#1B5E42]" />
            Farm Health Records
          </CardTitle>
          <div className="flex gap-2 mt-4">
            <Button
              variant={recordTab === 'animals' ? 'default' : 'ghost'}
              className={recordTab === 'animals' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
              onClick={() => setRecordTab('animals')}
            >
              Animals
            </Button>
            <Button
              variant={recordTab === 'treatments' ? 'default' : 'ghost'}
              className={recordTab === 'treatments' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
              onClick={() => setRecordTab('treatments')}
            >
              Treatments
            </Button>
            <Button
              variant={recordTab === 'compliance' ? 'default' : 'ghost'}
              className={recordTab === 'compliance' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
              onClick={() => setRecordTab('compliance')}
            >
              Compliance
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recordTab === 'animals' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F7F5F0]">
                  <TableHead className="text-[#7A7A6E]">Tag Number</TableHead>
                  <TableHead className="text-[#7A7A6E]">Species</TableHead>
                  <TableHead className="text-[#7A7A6E]">Age</TableHead>
                  <TableHead className="text-[#7A7A6E]">Health Status</TableHead>
                  <TableHead className="text-[#7A7A6E]">Last Checkup</TableHead>
                  <TableHead className="text-[#7A7A6E]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animals.map(animal => (
                  <TableRow key={animal.id} className="hover:bg-[#F7F5F0]">
                    <TableCell className="font-medium text-gray-900">{animal.tag}</TableCell>
                    <TableCell className="text-[#7A7A6E]">{animal.species}</TableCell>
                    <TableCell className="text-[#7A7A6E]">{animal.age}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusStyle(animal.status)} px-2 py-1 text-xs rounded-full`}>
                        {animal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#7A7A6E]">{animal.lastCheckup}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-[#1B5E42]">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {recordTab === 'treatments' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F7F5F0]">
                  <TableHead className="text-[#7A7A6E]">Animal</TableHead>
                  <TableHead className="text-[#7A7A6E]">Drug</TableHead>
                  <TableHead className="text-[#7A7A6E]">Dose</TableHead>
                  <TableHead className="text-[#7A7A6E]">Vet</TableHead>
                  <TableHead className="text-[#7A7A6E]">Date</TableHead>
                  <TableHead className="text-[#7A7A6E]">Withdrawal End</TableHead>
                  <TableHead className="text-[#7A7A6E]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map(treatment => (
                  <TableRow key={treatment.id} className="hover:bg-[#F7F5F0]">
                    <TableCell className="font-medium text-gray-900">{treatment.animal}</TableCell>
                    <TableCell className="text-[#7A7A6E]">{treatment.drug}</TableCell>
                    <TableCell className="text-[#7A7A6E]">{treatment.dose}</TableCell>
                    <TableCell className="text-[#7A7A6E]">{treatment.vet}</TableCell>
                    <TableCell className="text-[#7A7A6E]">{treatment.date}</TableCell>
                    <TableCell className="text-[#7A7A6E]">{treatment.withdrawalEnd}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusStyle(treatment.status)} px-2 py-1 text-xs rounded-full`}>
                        {treatment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {recordTab === 'compliance' && (
            <div className="p-6 space-y-6">
              {/* Compliance Score Gauge */}
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#F7F5F0" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#1B5E42"
                      strokeWidth="8"
                      strokeDasharray={`${complianceData.percentage * 2.51} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{complianceData.percentage}%</span>
                    <span className="text-sm text-[#7A7A6E]">Compliant</span>
                  </div>
                </div>
              </div>

              {/* Compliance Items List */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F7F5F0]">
                    <TableHead className="text-[#7A7A6E]">Item</TableHead>
                    <TableHead className="text-[#7A7A6E]">Status</TableHead>
                    <TableHead className="text-[#7A7A6E]">Last Review</TableHead>
                    <TableHead className="text-[#7A7A6E]">Next Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceItems.map(item => (
                    <TableRow key={item.id} className="hover:bg-[#F7F5F0]">
                      <TableCell className="font-medium text-gray-900">{item.item}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusStyle(item.status)} px-2 py-1 text-xs rounded-full`}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#7A7A6E]">{item.lastReview}</TableCell>
                      <TableCell className="text-[#7A7A6E]">{item.nextDue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAlertsScreen = () => (
    <div className="space-y-6">
      {/* Header with Filter */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <AlertTriangle className="w-5 h-5 text-[#C0392B]" />
              Alerts & Notifications
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={alertFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                className={alertFilter === 'all' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
                onClick={() => setAlertFilter('all')}
              >
                All
              </Button>
              <Button
                variant={alertFilter === 'outbreak' ? 'default' : 'ghost'}
                size="sm"
                className={alertFilter === 'outbreak' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
                onClick={() => setAlertFilter('outbreak')}
              >
                Outbreaks
              </Button>
              <Button
                variant={alertFilter === 'vet' ? 'default' : 'ghost'}
                size="sm"
                className={alertFilter === 'vet' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
                onClick={() => setAlertFilter('vet')}
              >
                Vet Messages
              </Button>
              <Button
                variant={alertFilter === 'system' ? 'default' : 'ghost'}
                size="sm"
                className={alertFilter === 'system' ? 'bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'}
                onClick={() => setAlertFilter('system')}
              >
                System
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredAlerts.map(alert => {
              const Icon = alert.type === 'outbreak' ? AlertTriangle : alert.type === 'vet' ? User : AlertCircle;
              return (
                <div
                  key={alert.id}
                  className="p-5 bg-[#F7F5F0] rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      alert.severity === 'critical' ? 'bg-[#C0392B]/10' :
                      alert.severity === 'high' ? 'bg-[#E8A838]/10' :
                      'bg-[#1B5E42]/10'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        alert.severity === 'critical' ? 'text-[#C0392B]' :
                        alert.severity === 'high' ? 'text-[#E8A838]' :
                        'text-[#1B5E42]'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <Badge className={`${getSeverityStyle(alert.severity)} px-3 py-1 text-xs rounded-full`}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#7A7A6E] mb-2">{alert.description}</p>
                      <p className="text-xs text-[#7A7A6E]">{alert.timestamp}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#1B5E42]">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex">
      {/* Fixed Left Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E3DC] flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-[#E5E3DC]">
          <img src={logoImg} alt="Kavach" className="h-10" />
          <p className="text-xs text-[#7A7A6E] mt-2">Farm Biosecurity Portal</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-colors ${
                  isActive
                    ? 'bg-[#1B5E42] text-white'
                    : 'text-[#7A7A6E] hover:bg-[#F7F5F0]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#E5E3DC]">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[#7A7A6E] hover:bg-[#F7F5F0] transition-all" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E5E3DC] px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Farm Owner Dashboard</h2>
            
            <div className="flex items-center gap-6">
              <button className="text-[#7A7A6E] hover:text-gray-900 transition-colors">
                <Search className="w-5 h-5" />
              </button>
              
              <button className="relative text-[#7A7A6E] hover:text-gray-900 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-[#C0392B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1B5E42] flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-[#7A7A6E]">Farm Owner</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export { FarmOwnerDashboard };
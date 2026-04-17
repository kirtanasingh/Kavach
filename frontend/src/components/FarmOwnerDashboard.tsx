import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
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
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import type { LucideIcon } from 'lucide-react';
import logoImg from 'figma:asset/28cc7f8b67ba61bb13e03c30f73fd05e9d3d8a2c.png';
import { ProfileMenu } from './ProfileMenu';
import { analyzeImage } from '../services/diseaseDetectionService';
import {
  clearFarmerDetectionHistory,
  deleteFarmerDetection,
  fetchFarmerDetectionHistory,
  type DetectionRecord,
} from '../services/detectionRecordsService';
import {
  farmOwnerService,
  type Animal as FarmAnimal,
  type DashboardSummary,
  type FarmerAppointmentRequest,
  type FarmAlert,
  type FarmTask,
  type RiskAssessmentInsights,
  type RiskAssessmentProfile,
  type RiskAssessmentStatus,
  type RiskProfileQnA,
  type VetOption,
} from '../services/farmOwnerService';

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
  vetNote?: string;
  image: string;
  date: string;
}

interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  category: 'preventive' | 'hygiene' | 'task' | 'detection';
  source: 'risk' | 'tasks' | 'detections' | 'mock';
}

interface AlertFeedItem {
  id: string;
  type: 'outbreak' | 'vet' | 'system';
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
}

interface VetNotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  source: 'vet_note' | 'vet_alert';
  severity: 'High' | 'Medium' | 'Low';
}

type AppointmentRequestDraft = {
  vet_user_id: string;
  appointment_type: 'routine' | 'emergency' | 'follow_up' | 'vaccination';
  preferred_datetime: string;
  reason_notes: string;
};

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

const formatReviewStatus = (value?: string): string => {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'safe') return 'Safe';
  if (normalized === 'not_safe' || normalized === 'unsafe') return 'Not Safe';
  if (normalized === 'other' || normalized === 'needs_followup') return 'Needs Manual Review';
  if (normalized === 'pending' || normalized === 'pending_review') return 'Pending';
  return 'Pending';
};


const mapHistoryRecord = (record: DetectionRecord): DetectionHistoryItem => ({
  id: String(record.id),
  disease: record.predicted_label || 'Unknown',
  confidence: Math.round((record.confidence ?? 0) * 100),
  severity: mapSeverityToLabel(record.severity),
  animalType: (record.species || 'pig') as DetectionAnimalType,
  // Review status must come only from vet review state, not model prediction status.
  status: formatReviewStatus(record.review_status),
  recommendation: record.recommendation ?? '',
  vetNote: record.vet_note ?? undefined,
  image:
    (record.species || '').toLowerCase() === 'pig'
      ? '🐷'
      : (record.species || '').toLowerCase() === 'poultry'
      ? '🐔'
      : '🐄',
  date: new Date(record.created_at).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
});

const riskFormDefaults: RiskProfileQnA = {
  farm_name: '',
  location_city_village: '',
  location_state: '',
  animal_count: 0,
  animal_types: [],
  water_source: 'well',
  feeding_system: 'manual',
  vaccination_status: 'unknown',
  recent_disease: false,
  recent_disease_details: '',
  waste_management: 'basic',
  vet_service_usage: 'rare',
};

const animalTypeOptions = ['cow', 'buffalo', 'poultry', 'goat', 'pig', 'sheep', 'other'];
const PRIMARY_VET_EMAIL = 'kirtana.singh@vit.edu.in';
const PRIMARY_VET_USER_ID = '5827726e-376b-4adb-ba26-89973d9ae32d';
const PRIMARY_VET_NAME = 'Aradhya';

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

export default function FarmOwnerDashboard({ initialNav = 'home', onNavigate, onLogout, userName = '', userEmail }: FarmOwnerDashboardProps) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(initialNav);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [taskTab, setTaskTab] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [recordTab, setRecordTab] = useState<'animals' | 'treatments'>('animals');
  const [alertFilter, setAlertFilter] = useState<'all' | 'outbreak' | 'vet' | 'system'>('all');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [animalType, setAnimalType] = useState<'Pig' | 'Poultry' | 'Cattle'>('Pig');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<DetectionHistoryItem[]>([]);
  const [historyAnimalFilter, setHistoryAnimalFilter] = useState<'all' | 'pig' | 'poultry' | 'cattle'>('all');
  const [historySeverityFilter, setHistorySeverityFilter] = useState<'all' | 'High' | 'Medium' | 'Low' | 'Unknown'>('all');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [farmAnimals, setFarmAnimals] = useState<FarmAnimal[]>([]);
  const [farmAlerts, setFarmAlerts] = useState<FarmAlert[]>([]);
  const [riskStatus, setRiskStatus] = useState<RiskAssessmentStatus | null>(null);
  const [riskProfile, setRiskProfile] = useState<RiskAssessmentProfile | null>(null);
  const [riskInsights, setRiskInsights] = useState<RiskAssessmentInsights | null>(null);
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [riskStep, setRiskStep] = useState(1);
  const [riskForm, setRiskForm] = useState<RiskProfileQnA>(riskFormDefaults);
  const [riskFormError, setRiskFormError] = useState<string | null>(null);
  const [isSavingRisk, setIsSavingRisk] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertFeedItem | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'moderate',
    animal: 'general',
  });
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [appointmentRequestError, setAppointmentRequestError] = useState<string | null>(null);
  const [appointmentRequests, setAppointmentRequests] = useState<FarmerAppointmentRequest[]>([]);
  const [assignedVets, setAssignedVets] = useState<VetOption[]>([]);
  const [isSavingAppointmentRequest, setIsSavingAppointmentRequest] = useState(false);
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentRequestDraft>({
    vet_user_id: '',
    appointment_type: 'routine',
    preferred_datetime: '',
    reason_notes: '',
  });

  const refreshDashboardData = async () => {
    try {
      const [sum, taskList, animalList, alertList, riskAssessmentStatus] = await Promise.all([
        farmOwnerService.getSummary(),
        farmOwnerService.getTasks(),
        farmOwnerService.getAnimals(),
        farmOwnerService.getAlerts({ limit: 20 }),
        farmOwnerService.getRiskAssessmentStatus().catch(() => null),
      ]);
      setSummary(sum);
      setTasks(taskList);
      setFarmAnimals(animalList);
      setFarmAlerts(alertList);
      setRiskStatus(riskAssessmentStatus);

      if (riskAssessmentStatus?.exists) {
        const [profile, insights] = await Promise.all([
          farmOwnerService.getRiskAssessmentProfile().catch(() => null),
          farmOwnerService.getRiskAssessmentInsights().catch(() => null),
        ]);
        setRiskProfile(profile);
        setRiskInsights(insights);
        if (profile) {
          setRiskForm({
            farm_name: profile.farm_name,
            location_city_village: profile.location_city_village,
            location_state: profile.location_state,
            animal_count: profile.animal_count,
            animal_types: profile.animal_types,
            water_source: profile.water_source,
            feeding_system: profile.feeding_system,
            vaccination_status: profile.vaccination_status,
            recent_disease: profile.recent_disease,
            recent_disease_details: profile.recent_disease_details || '',
            waste_management: profile.waste_management,
            vet_service_usage: profile.vet_service_usage,
          });
        }
      }
    } catch {
      setSummary(null);
      setTasks([]);
      setFarmAnimals([]);
      setFarmAlerts([]);
      setRiskStatus(null);
      setRiskProfile(null);
      setRiskInsights(null);
    }
  };

  useEffect(() => {
    setActiveNav(initialNav);
  }, [initialNav]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kavach_vet_notification_read_ids');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setReadNotificationIds(parsed);
      }
    } catch {
      // Ignore corrupted local storage value.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kavach_vet_notification_read_ids', JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    fetchFarmerDetectionHistory()
      .then((rows) => setDetectionHistory(rows.map(mapHistoryRecord)))
      .catch(() => setDetectionHistory([]));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchFarmerDetectionHistory()
        .then((rows) => setDetectionHistory(rows.map(mapHistoryRecord)))
        .catch(() => undefined);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void refreshDashboardData();
  }, []);

  useEffect(() => {
    const loadAppointmentContext = async () => {
      const fallbackVet: VetOption = {
        vet_user_id: PRIMARY_VET_USER_ID,
        vet_name: PRIMARY_VET_NAME,
        email: PRIMARY_VET_EMAIL,
        phone_number: undefined,
      };

      try {
        const [vets, requests] = await Promise.all([
          farmOwnerService.getMyVets(),
          farmOwnerService.getAppointmentRequests({ limit: 20 }),
        ]);

        const primaryVets = vets.filter(
          (vet) => (vet.email || '').toLowerCase() === PRIMARY_VET_EMAIL
        );
        const visibleVets = primaryVets.length > 0 ? primaryVets : vets.length > 0 ? vets : [fallbackVet];

        setAssignedVets(visibleVets);
        setAppointmentRequests(requests);
        setAppointmentDraft((prev) => ({
          ...prev,
          vet_user_id: prev.vet_user_id || visibleVets[0]?.vet_user_id || '',
        }));
      } catch {
        setAssignedVets([fallbackVet]);
        setAppointmentRequests([]);
        setAppointmentDraft((prev) => ({
          ...prev,
          vet_user_id: prev.vet_user_id || fallbackVet.vet_user_id,
        }));
      }
    };

    void loadAppointmentContext();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshDashboardData();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const detectionSafeCount = useMemo(
    () => detectionHistory.filter((d) => (d.status || '').toLowerCase() === 'safe').length,
    [detectionHistory]
  );

  const detectionConcernCount = useMemo(
    () => detectionHistory.filter((d) => d.severity === 'High' || (d.status || '').toLowerCase().includes('not')).length,
    [detectionHistory]
  );

  const pendingTaskCount = useMemo(
    () => tasks.filter((t) => (t.status || '').toLowerCase() !== 'completed').length,
    [tasks]
  );

  const overdueTaskCount = summary?.overdue_tasks ?? 0;

  const derivedTotalAnimals = useMemo(
    () => Math.max(summary?.total_animals ?? 0, farmAnimals.length, riskProfile?.animal_count ?? 0),
    [summary?.total_animals, farmAnimals.length, riskProfile?.animal_count]
  );

  const derivedHealthyAnimals = useMemo(() => {
    if (summary && summary.total_animals > 0) return summary.healthy_animals;
    if (farmAnimals.length > 0) {
      return farmAnimals.filter((a) => (a.health_status || '').toLowerCase() === 'healthy').length;
    }
    if (derivedTotalAnimals === 0) return 0;
    if (detectionConcernCount === 0) return derivedTotalAnimals;
    return Math.max(derivedTotalAnimals - Math.min(detectionConcernCount, derivedTotalAnimals), 0);
  }, [summary, farmAnimals, derivedTotalAnimals, detectionConcernCount]);

  const derivedSickAnimals = useMemo(() => {
    if (summary && summary.total_animals > 0) return summary.sick_animals;
    if (farmAnimals.length > 0) {
      return farmAnimals.filter((a) => (a.health_status || '').toLowerCase() !== 'healthy').length;
    }
    if (derivedTotalAnimals === 0) return 0;
    return Math.max(derivedTotalAnimals - derivedHealthyAnimals, 0);
  }, [summary, farmAnimals, derivedTotalAnimals, derivedHealthyAnimals]);

  const derivedComplianceRate = useMemo(() => {
    if (summary && summary.total_animals > 0) {
      return Math.round((summary.healthy_animals / summary.total_animals) * 100);
    }
    if (detectionHistory.length > 0) {
      return Math.round((detectionSafeCount / detectionHistory.length) * 100);
    }
    if ((riskStatus?.completion_percent ?? 0) > 0) {
      return riskStatus?.completion_percent ?? 0;
    }
    return 0;
  }, [summary, detectionHistory.length, detectionSafeCount, riskStatus?.completion_percent]);

  const derivedActiveAlerts = useMemo(() => {
    const unreadBackend = summary?.unread_alerts ?? farmAlerts.filter((a) => !a.is_read).length;
    const riskSignals = riskInsights?.dashboard_flags?.high_risk_mode ? 1 : 0;
    const detectionSignals = detectionConcernCount > 0 ? 1 : 0;
    const taskSignals = overdueTaskCount > 0 ? 1 : 0;
    return Math.max(unreadBackend, riskSignals + detectionSignals + taskSignals);
  }, [summary?.unread_alerts, farmAlerts, riskInsights?.dashboard_flags?.high_risk_mode, detectionConcernCount, overdueTaskCount]);

  const stats = {
    totalAnimals: derivedTotalAnimals,
    activeAlerts: derivedActiveAlerts,
    complianceRate: derivedComplianceRate,
    pendingTasks: Math.max(summary?.pending_tasks ?? 0, pendingTaskCount),
  };

  const mapTask = (task: FarmTask) => {
    const dueDate = task.due_at
      ? new Date(task.due_at).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No due date';
    const rawPriority = (task.priority || 'medium').toLowerCase();

    return {
      id: task.id,
      task: task.title,
      title: task.title,
      description: task.description,
      animal: task.category ? task.category.charAt(0).toUpperCase() + task.category.slice(1) : 'General',
      assignedTo: task.assigned_to_name || 'Unassigned',
      assignee: task.assigned_to_name || 'Unassigned',
      assigneeAvatar: (task.assigned_to_name || 'UN').slice(0, 2).toUpperCase(),
      priority: rawPriority === 'medium' ? 'Moderate' : rawPriority.charAt(0).toUpperCase() + rawPriority.slice(1),
      due: dueDate,
      dueDate,
      completedDate: task.completed_at,
      status: (task.status || 'pending').replace('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
    };
  };

  const pendingTasks = tasks.filter((t) => (t.status || '').toLowerCase() !== 'completed');
  const todayTasks: any[] = pendingTasks.slice(0, 6).map(mapTask);
  const upcomingTasks: any[] = pendingTasks.slice(6).map(mapTask);
  const completedTasks: any[] = tasks
    .filter((t) => (t.status || '').toLowerCase() === 'completed')
    .map(mapTask);

  const animals: any[] = farmAnimals.map((animal) => ({
    id: animal.id,
    tag: animal.tag_number,
    species: animal.species,
    type: animal.species,
    breed: animal.breed || '--',
    age: animal.age_text || (animal.age_months != null ? `${animal.age_months} months` : '--'),
    status: (animal.health_status || 'unknown').replace('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
    health: (animal.health_status || 'unknown').replace('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
    lastCheckup: animal.last_checkup_at || '--',
    vaccinated: (animal.vaccination_status || '').toLowerCase() === 'up_to_date',
  }));

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

  const backendAlerts: AlertFeedItem[] = farmAlerts.map((alert) => ({
    id: alert.id,
    type:
      alert.type === 'withdrawal_violation'
        ? 'system'
        : alert.type.includes('outbreak')
        ? 'outbreak'
        : alert.type.includes('vet')
        ? 'vet'
        : 'system',
    title: alert.title,
    description: alert.message || 'No details available',
    severity: ((alert.severity || 'medium').replace(/\b\w/g, (ch) => ch.toUpperCase()) as 'High' | 'Medium' | 'Low'),
    timestamp: new Date(alert.created_at).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  const mockAlerts: AlertFeedItem[] = [
    {
      id: 'mock-alert-1',
      type: 'system',
      title: 'High temperature detected in cattle shed',
      severity: 'High',
      timestamp: 'Today, 10:30',
      description: 'Temperature crossed 32 C in Shed 2. Improve airflow and check water points.',
    },
    {
      id: 'mock-alert-2',
      type: 'vet',
      title: 'Vaccination overdue for 5 animals',
      severity: 'Medium',
      timestamp: 'Today, 08:15',
      description: 'Routine booster is overdue for a small group. Schedule vet visit this week.',
    },
    {
      id: 'mock-alert-3',
      type: 'outbreak',
      title: 'Possible infection detected in recent scan',
      severity: 'High',
      timestamp: 'Yesterday, 16:40',
      description: 'One recent detection showed elevated disease confidence. Monitor affected animals closely.',
    },
    {
      id: 'mock-alert-4',
      type: 'system',
      title: 'Feed stock running low for next cycle',
      severity: 'Low',
      timestamp: 'Yesterday, 09:20',
      description: 'Projected feed balance may not cover the next full cycle. Plan replenishment.',
    },
  ];

  const alerts: AlertFeedItem[] = backendAlerts.length > 0 ? backendAlerts : mockAlerts;

  const diseaseAlerts: any[] = [
    { id: 1, disease: 'Newcastle Disease', animal: 'Chicken #1923', risk: 'High', severity: 'Critical', cases: 8, trend: 'up', distance: '5 km', affected: '12 birds', status: 'Active' },
    { id: 2, disease: 'Avian Influenza', animal: 'Chicken Flock B', risk: 'Medium', severity: 'High', cases: 3, trend: 'stable', distance: '12 km', affected: '8 birds', status: 'Monitoring' },
    { id: 3, disease: 'Swine Flu', animal: 'Pig #2847', risk: 'Low', severity: 'Medium', cases: 1, trend: 'down', distance: '18 km', affected: '1 pig', status: 'Testing' },
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
      case 'safe':
        return 'bg-[#4CAF7D] text-white';
      case 'not safe':
      case 'not_safe':
      case 'unsafe':
        return 'bg-[#C0392B] text-white';
      case 'needs manual review':
      case 'needs_followup':
        return 'bg-[#7A7A6E] text-white';
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
      case 'moderate':
        return 'bg-[#E8A838] text-white';
      case 'low':
        return 'bg-[#4CAF7D] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRiskLevelStyle = (level?: string | null) => {
    const normalized = (level || '').toLowerCase();
    if (normalized === 'low') return 'bg-[#4CAF7D] text-white';
    if (normalized === 'medium') return 'bg-[#E8A838] text-white';
    if (normalized === 'high') return 'bg-[#C0392B] text-white';
    return 'bg-[#7A7A6E] text-white';
  };

  const handleNavClick = (navId: 'home' | 'detection' | 'tasks' | 'records' | 'alerts' | 'compliance' | 'reports') => {
    if (navId === 'detection') {
      // Keep detection tab responsive even when already on /dashboard/vlm.
      setActiveNav('detection');
      navigate('/dashboard/vlm');
      return;
    }
    if (navId === 'compliance') {
      setActiveNav('compliance');
      return;
    }
    setActiveNav(navId);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'moderate',
      animal: 'general',
    });
  };

  const handleAddTask = () => {
    setTaskFormError(null);
    setIsTaskDialogOpen(true);
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      setTaskFormError('Task title is required.');
      return;
    }

    setIsCreatingTask(true);
    setTaskFormError(null);

    try {
      const created = await farmOwnerService.createTask({
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        priority: taskForm.priority === 'moderate' ? 'medium' : taskForm.priority,
        status: 'pending',
        category: taskForm.animal,
      });
      // Optimistically add to top of list
      setTasks((prev) => [created, ...prev]);
      setIsTaskDialogOpen(false);
      resetTaskForm();
      // Switch to tasks view + today tab
      setActiveNav('tasks');
      setTaskTab('today');
      void refreshDashboardData();
    } catch (error: any) {
      setTaskFormError(error?.message || 'Failed to create task.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleToggleTaskComplete = async (taskId: string, currentStatus: string) => {
    const isDone = currentStatus.toLowerCase() === 'completed';
    const newStatus = isDone ? 'pending' : 'completed';

    // Optimistic update - instant UI response
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined }
          : t
      )
    );

    try {
      if (newStatus === 'completed') {
        await farmOwnerService.completeTask(taskId);
      } else {
        await farmOwnerService.updateTask(taskId, { status: 'pending', completed_at: undefined });
      }
      // Refresh summary counts
      void refreshDashboardData();
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: currentStatus } : t
        )
      );
    }
  };

  const openRiskDialog = () => {
    setRiskFormError(null);
    setRiskStep(1);
    setIsRiskDialogOpen(true);
  };

  const validateRiskStep = () => {
    if (riskStep === 1) {
      if (!riskForm.farm_name.trim()) return 'Farm name is required.';
      if (!riskForm.location_city_village.trim()) return 'Farm city/village is required.';
      if (!riskForm.location_state.trim()) return 'State is required.';
      if (!riskForm.animal_count || riskForm.animal_count < 1) return 'Number of animals must be at least 1.';
      if (!riskForm.animal_types.length) return 'Select at least one animal type.';
    }
    if (riskStep === 2) {
      if (!riskForm.water_source) return 'Water source is required.';
      if (!riskForm.feeding_system) return 'Feeding system is required.';
      if (!riskForm.waste_management) return 'Waste management practice is required.';
      if (!riskForm.vet_service_usage) return 'Veterinary service usage is required.';
    }
    if (riskStep === 3 && riskForm.recent_disease && !riskForm.recent_disease_details?.trim()) {
      return 'Please provide disease details when recent disease history is yes.';
    }
    return null;
  };

  const saveRiskDraft = async () => {
    setRiskFormError(null);
    setIsSavingRisk(true);
    try {
      const profile = await farmOwnerService.saveRiskAssessmentDraft(riskForm);
      setRiskProfile(profile);
      setRiskStatus({
        exists: true,
        is_complete: false,
        completion_percent: profile.completion_percent,
        risk_score: profile.risk_score,
        risk_level: profile.risk_level,
        updated_at: profile.updated_at,
      });
      const insights = await farmOwnerService.getRiskAssessmentInsights().catch(() => null);
      setRiskInsights(insights);
      setIsRiskDialogOpen(false);
      void refreshDashboardData();
    } catch (error: any) {
      setRiskFormError(error?.message || 'Unable to save draft.');
    } finally {
      setIsSavingRisk(false);
    }
  };

  const submitRiskProfile = async () => {
    const stepError = validateRiskStep();
    if (stepError) {
      setRiskFormError(stepError);
      return;
    }

    setRiskFormError(null);
    setIsSavingRisk(true);
    try {
      const profile = await farmOwnerService.submitRiskAssessmentProfile(riskForm);
      setRiskProfile(profile);
      setRiskStatus({
        exists: true,
        is_complete: !profile.is_draft && profile.completion_percent === 100,
        completion_percent: profile.completion_percent,
        risk_score: profile.risk_score,
        risk_level: profile.risk_level,
        updated_at: profile.updated_at,
      });
      const insights = await farmOwnerService.getRiskAssessmentInsights().catch(() => null);
      setRiskInsights(insights);
      setIsRiskDialogOpen(false);
      void refreshDashboardData();
    } catch (error: any) {
      setRiskFormError(error?.message || 'Unable to submit assessment.');
    } finally {
      setIsSavingRisk(false);
    }
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

      const rows = await fetchFarmerDetectionHistory();
      setDetectionHistory(rows.map(mapHistoryRecord));
      void refreshDashboardData();
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

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await deleteFarmerDetection(id);
      setDetectionHistory((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setAnalysisError('Failed to delete detection record.');
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearFarmerDetectionHistory();
      setDetectionHistory([]);
    } catch {
      setAnalysisError('Failed to clear detection history.');
    }
  };

  const menuItems: Array<{ id: 'home' | 'detection' | 'tasks' | 'records' | 'alerts' | 'compliance' | 'reports'; label: string; icon: LucideIcon }> = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'detection', label: 'Disease Detection', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const filteredAlerts = alertFilter === 'all' ? alerts : alerts.filter(a => a.type === alertFilter);
  const vetNotifications = useMemo<VetNotificationItem[]>(() => {
    const fromDetections: VetNotificationItem[] = detectionHistory
      .filter((item) => Boolean(item.vetNote?.trim()))
      .map((item) => ({
        id: `vet-note-${item.id}`,
        title: `Vet message on ${item.disease}`,
        message: item.vetNote || '',
        timestamp: item.date,
        source: 'vet_note',
        severity: item.severity === 'High' ? 'High' : item.severity === 'Medium' ? 'Medium' : 'Low',
      }));

    const fromAlerts: VetNotificationItem[] = alerts
      .filter((alert) => alert.type === 'vet')
      .map((alert) => ({
        id: `vet-alert-${alert.id}`,
        title: alert.title,
        message: alert.description,
        timestamp: alert.timestamp,
        source: 'vet_alert',
        severity: alert.severity,
      }));

    const merged = [...fromAlerts, ...fromDetections];
    const seen = new Set<string>();
    return merged.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [detectionHistory, alerts]);

  const unreadNotificationCount = useMemo(
    () => vetNotifications.filter((n) => !readNotificationIds.includes(n.id)).length,
    [vetNotifications, readNotificationIds]
  );

  const markAllNotificationsRead = () => {
    const ids = vetNotifications.map((n) => n.id);
    setReadNotificationIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const selectedAlertForView = useMemo(() => {
    if (selectedAlert && filteredAlerts.some((a) => a.id === selectedAlert.id)) {
      return selectedAlert;
    }
    return filteredAlerts[0] ?? null;
  }, [selectedAlert, filteredAlerts]);

  const alertTrendData = useMemo(() => {
    const severity = selectedAlertForView?.severity || 'Medium';
    const base = severity === 'High' ? [22, 20, 17, 16, 13, 11, 9] : severity === 'Low' ? [9, 8, 8, 7, 6, 6, 5] : [15, 14, 13, 12, 11, 10, 9];
    return ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Today'].map((day, idx) => ({
      day,
      affected_farms: base[idx],
    }));
  }, [selectedAlertForView]);

  const alertImpactBreakdown = useMemo(() => {
    const regionalRiskFarms = Math.max(detectionConcernCount + farmAlerts.length + (riskInsights?.dashboard_flags?.high_risk_mode ? 2 : 1), 1);
    const monitoredFarms = Math.max(Math.round(regionalRiskFarms * 1.6), regionalRiskFarms + 2);
    const controlledFarms = Math.max(monitoredFarms - regionalRiskFarms, 1);
    return [
      { name: 'High Risk Farms', value: regionalRiskFarms },
      { name: 'Under Monitoring', value: monitoredFarms },
      { name: 'Controlled', value: controlledFarms },
    ];
  }, [detectionConcernCount, farmAlerts.length, riskInsights?.dashboard_flags?.high_risk_mode]);

  const alertPreventionTips = useMemo(() => {
    const type = selectedAlertForView?.type;
    if (type === 'outbreak') {
      return [
        'Restrict movement of animals and visitors for 48-72 hours.',
        'Separate symptomatic animals and disinfect tools after each use.',
        'Increase temperature and symptom checks to twice daily.',
      ];
    }
    if (type === 'vet') {
      return [
        'Follow vet instructions exactly and track all medicine administration.',
        'Update treatment records and schedule follow-up on unresolved cases.',
        'Flag animals with unresolved symptoms for priority re-evaluation.',
      ];
    }
    return [
      'Improve shed ventilation and clean feeding/watering points daily.',
      'Complete overdue vaccinations and pending biosecurity tasks this week.',
      'Keep logs updated so unusual trends can be identified early.',
    ];
  }, [selectedAlertForView]);

  const currentTasks = taskTab === 'today' ? todayTasks : taskTab === 'upcoming' ? upcomingTasks : completedTasks;
  const suggestions = useMemo<SuggestionItem[]>(() => {
    const generated: SuggestionItem[] = [];

    if (riskInsights?.recommendations?.length) {
      riskInsights.recommendations.slice(0, 3).forEach((rec, idx) => {
        generated.push({
          id: `risk-${idx}`,
          title: rec.title,
          description: rec.message,
          severity: rec.priority === 'high' ? 'High' : rec.priority === 'medium' ? 'Medium' : 'Low',
          category: rec.code.includes('waste') ? 'hygiene' : 'preventive',
          source: 'risk',
        });
      });
    }

    const overdueCount = summary?.overdue_tasks ?? 0;
    if (overdueCount > 0) {
      generated.push({
        id: 'tasks-overdue',
        title: `Complete ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}`,
        description: 'Prioritize delayed tasks to avoid compounding health and compliance risk.',
        severity: 'High',
        category: 'task',
        source: 'tasks',
      });
    }

    const pendingCount = pendingTasks.length;
    if (pendingCount > 0) {
      generated.push({
        id: 'tasks-pending',
        title: `Complete pending farm tasks (${pendingCount})`,
        description: 'Close feeding, sanitation, and review tasks to keep routine operations stable.',
        severity: pendingCount > 5 ? 'Medium' : 'Low',
        category: 'task',
        source: 'tasks',
      });
    }

    const recentHighDetections = detectionHistory.filter((d) => d.severity === 'High').length;
    if (recentHighDetections > 0) {
      generated.push({
        id: 'detect-high',
        title: 'Recent disease detected - monitor affected animals',
        description: `${recentHighDetections} high-severity detection${recentHighDetections > 1 ? 's' : ''} found recently. Isolate and observe these groups.`,
        severity: 'High',
        category: 'detection',
        source: 'detections',
      });
    }

    if ((riskProfile?.waste_management || '').toLowerCase() !== 'scientific') {
      generated.push({
        id: 'hygiene-core',
        title: 'Clean animal shelter regularly',
        description: 'Increase cleaning frequency around bedding, feed points, and water lines to reduce pathogen load.',
        severity: 'Medium',
        category: 'hygiene',
        source: riskProfile ? 'risk' : 'mock',
      });
    }

    if ((riskProfile?.vaccination_status || '').toLowerCase() !== 'regular') {
      generated.push({
        id: 'preventive-vaccination',
        title: 'Ensure vaccination schedule is up to date',
        description: 'Align upcoming doses with your vet calendar and verify records per group.',
        severity: 'High',
        category: 'preventive',
        source: riskProfile ? 'risk' : 'mock',
      });
    }

    if (generated.length > 0) {
      return generated.slice(0, 6);
    }

    return [
      {
        id: 'mock-1',
        title: 'Ensure vaccination schedule is up to date',
        description: 'Review vaccine due dates this week and prepare reminders for the next cycle.',
        severity: 'Medium',
        category: 'preventive',
        source: 'mock',
      },
      {
        id: 'mock-2',
        title: 'Clean animal shelter regularly',
        description: 'Daily cleaning of high-contact zones can reduce disease spread risk.',
        severity: 'Low',
        category: 'hygiene',
        source: 'mock',
      },
      {
        id: 'mock-3',
        title: 'Complete pending feeding tasks',
        description: 'Clear pending feed distribution and water checks to keep growth consistent.',
        severity: 'Medium',
        category: 'task',
        source: 'mock',
      },
      {
        id: 'mock-4',
        title: 'Recent disease detected - monitor affected animals',
        description: 'Increase observation frequency and track symptom progression for flagged animals.',
        severity: 'High',
        category: 'detection',
        source: 'mock',
      },
    ];
  }, [riskInsights, summary?.overdue_tasks, pendingTasks.length, detectionHistory, riskProfile]);

  const taskCompletionData = useMemo(
    () => [
      { name: 'Pending', value: tasks.filter((t) => (t.status || '').toLowerCase() === 'pending').length },
      { name: 'In Progress', value: tasks.filter((t) => (t.status || '').toLowerCase() === 'in_progress').length },
      { name: 'Completed', value: tasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length },
    ],
    [tasks]
  );

  const detectionTrendData = useMemo(() => {
    const buckets: Record<string, number> = {};
    detectionHistory.forEach((item) => {
      const label = item.date.split(',')[0] || item.date;
      buckets[label] = (buckets[label] || 0) + 1;
    });
    const rows = Object.entries(buckets).map(([date, detections]) => ({ date, detections }));
    if (rows.length > 0) {
      return rows.slice(-7);
    }
    return [
      { date: 'Mon', detections: 1 },
      { date: 'Tue', detections: 3 },
      { date: 'Wed', detections: 2 },
      { date: 'Thu', detections: 4 },
      { date: 'Fri', detections: 2 },
      { date: 'Sat', detections: 1 },
      { date: 'Sun', detections: 2 },
    ];
  }, [detectionHistory]);

  const filteredDetectionHistory = detectionHistory.filter((item) => {
    const animalTypeMatch = historyAnimalFilter === 'all' || item.animalType === historyAnimalFilter;
    const severityMatch = historySeverityFilter === 'all' || item.severity === historySeverityFilter;
    return animalTypeMatch && severityMatch;
  });

  const recordsAnimals = detectionHistory.map((item) => ({
    id: item.id,
    tag: `D${item.id}`,
    species: item.animalType.charAt(0).toUpperCase() + item.animalType.slice(1),
    age: '--',
    status: item.status,
    lastCheckup: item.date,
  }));

  const recordsTreatments = detectionHistory
    .filter((item) => item.recommendation || item.vetNote)
    .map((item) => ({
      id: item.id,
      animal: `${item.animalType.toUpperCase()} #D${item.id}`,
      diagnosis: item.disease,
      vetMessage: item.vetNote || item.recommendation || 'No message',
      review: item.status,
      date: item.date,
      status: item.status,
    }));

  const reviewedCount = detectionHistory.filter((x) => x.status !== 'Pending').length;
  const safeCount = detectionHistory.filter((x) => x.status === 'Safe').length;
  const compliancePct = detectionHistory.length > 0 ? Math.round((safeCount / detectionHistory.length) * 100) : 0;
  const complianceRows = [
    {
      id: '1',
      item: 'Vet Reviews Completed',
      status: reviewedCount >= Math.ceil(Math.max(detectionHistory.length, 1) * 0.6) ? 'Compliant' : 'Pending',
      lastReview: detectionHistory[0]?.date || '--',
      nextDue: 'Immediate for pending records',
    },
    {
      id: '2',
      item: 'Healthy Clearance Rate',
      status: compliancePct >= 60 ? 'Compliant' : 'Needs Attention',
      lastReview: `${compliancePct}% safe`,
      nextDue: 'Continuous monitoring',
    },
    {
      id: '3',
      item: 'Unreviewed Detections',
      status: detectionHistory.some((x) => x.status === 'Pending') ? 'Pending' : 'Compliant',
      lastReview: `${detectionHistory.filter((x) => x.status === 'Pending').length} pending`,
      nextDue: 'Vet action required',
    },
  ];

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
        return renderComplianceScreen();
      case 'reports':
        return renderReportsScreen();
      default:
        return renderHomeScreen();
    }
  };

  const renderComplianceScreen = () => (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl border border-[#E5E3DC] overflow-hidden">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-5 bg-gradient-to-r from-[#F7F5F0] to-white">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Shield className="w-5 h-5 text-[#1B5E42]" />
            Compliance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-[#FCFBF8]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#E5E3DC] bg-white p-5 flex items-center justify-center">
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
                      strokeDasharray={`${compliancePct * 2.51} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{compliancePct}%</span>
                    <span className="text-sm text-[#7A7A6E]">Compliant</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E3DC] bg-white p-5">
                <p className="text-xs text-[#7A7A6E]">Compliant Checks</p>
                <p className="text-3xl font-bold text-[#1B5E42] mt-1">{safeCount}</p>
                <p className="text-xs text-[#7A7A6E] mt-2">Records marked safe by vet review.</p>
              </div>

              <div className="rounded-xl border border-[#E5E3DC] bg-white p-5">
                <p className="text-xs text-[#7A7A6E]">Pending / Attention</p>
                <p className="text-3xl font-bold text-[#C0392B] mt-1">{Math.max(detectionHistory.length - safeCount, 0)}</p>
                <p className="text-xs text-[#7A7A6E] mt-2">Needs review follow-up or corrective action.</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E3DC] bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="bg-[#F7F5F0]">
                      <TableHead className="text-[#7A7A6E]">Item</TableHead>
                      <TableHead className="text-[#7A7A6E]">Status</TableHead>
                      <TableHead className="text-[#7A7A6E]">Last Review</TableHead>
                      <TableHead className="text-[#7A7A6E]">Next Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceRows.map((item) => (
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportsScreen = () => (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-5 h-5 text-[#1B5E42]" />
            Reports Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#E5E3DC] bg-[#F7F5F0] p-4">
              <p className="text-xs text-[#7A7A6E]">Total Detections</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{detectionHistory.length}</p>
            </div>
            <div className="rounded-xl border border-[#E5E3DC] bg-[#F7F5F0] p-4">
              <p className="text-xs text-[#7A7A6E]">Average Confidence</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {detectionHistory.length > 0
                  ? `${Math.round(detectionHistory.reduce((sum, d) => sum + d.confidence, 0) / detectionHistory.length)}%`
                  : '--'}
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E3DC] bg-[#F7F5F0] p-4">
              <p className="text-xs text-[#7A7A6E]">High Severity Cases</p>
              <p className="text-2xl font-bold text-[#C0392B] mt-1">{detectionHistory.filter((d) => d.severity === 'High').length}</p>
            </div>
            <div className="rounded-xl border border-[#E5E3DC] bg-[#F7F5F0] p-4">
              <p className="text-xs text-[#7A7A6E]">Pending Tasks</p>
              <p className="text-2xl font-bold text-[#E8A838] mt-1">{stats.pendingTasks}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHomeScreen = () => (
    <>
      {/* Greeting */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{userName ? `Namaste, ${userName.split(' ')[0]}! 👋` : 'Good Morning! 👋'}</h3>
        <p className="text-sm text-[#7A7A6E] mt-1">Here's what's happening on your farm today</p>
      </div>

      {/* Risk Assessment QnA */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC] mb-6" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#1B5E42]" />
                <h4 className="text-base sm:text-lg font-semibold text-gray-900">Farm Risk Assessment QnA</h4>
                {riskStatus?.risk_level && (
                  <Badge className={`${getRiskLevelStyle(riskStatus.risk_level)} px-2 py-1 rounded-full text-xs`}>
                    {riskStatus.risk_level.toUpperCase()} RISK
                  </Badge>
                )}
              </div>

              <p className="text-sm text-[#7A7A6E] max-w-2xl">
                Complete this profile to personalize alerts, recommendations, and disease-risk insights for your farm.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="bg-[#F7F5F0] border border-[#E5E3DC] px-3 py-1 rounded-full text-[#7A7A6E]">
                  Completion: {riskStatus?.completion_percent ?? 0}%
                </span>
                {typeof riskStatus?.risk_score === 'number' && (
                  <span className="bg-[#EAF4EF] border border-[#CFE2D7] px-3 py-1 rounded-full text-[#1B5E42]">
                    Score: {riskStatus.risk_score}/100
                  </span>
                )}
                {riskStatus?.updated_at && (
                  <span className="text-[#7A7A6E]">Updated {new Date(riskStatus.updated_at).toLocaleDateString('en-GB')}</span>
                )}
              </div>

              {riskInsights?.top_risk_factors?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-900">Top Risk Factors</p>
                  <div className="flex flex-wrap gap-2">
                    {riskInsights.top_risk_factors.map((factor) => (
                      <span key={factor} className="text-xs bg-[#FFF6E5] border border-[#E8A838]/30 text-[#7A7A6E] px-2 py-1 rounded-full">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 lg:items-end">
              <Button className="bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg h-10" onClick={openRiskDialog}>
                {riskStatus?.exists ? (riskStatus.is_complete ? 'Update Assessment' : 'Continue Assessment') : 'Start Assessment'}
              </Button>
              {riskInsights?.dashboard_flags?.high_risk_mode && (
                <div className="text-xs text-[#C0392B] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  High risk mode is active.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-[#7A7A6E] mb-1">Total Animals</p>
                <p className="text-2xl font-bold leading-tight text-gray-900">{stats.totalAnimals.toLocaleString()}</p>
                <p className="text-xs text-[#4CAF7D] mt-1.5">
                  {derivedHealthyAnimals} healthy · {derivedSickAnimals} sick
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#1B5E42]/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#1B5E42]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-[#7A7A6E] mb-1">Active Alerts</p>
                <p className="text-2xl font-bold leading-tight text-gray-900">{stats.activeAlerts}</p>
                <p className={`text-xs mt-1.5 ${stats.activeAlerts > 0 ? 'text-[#C0392B]' : 'text-[#4CAF7D]'}`}>
                  {stats.activeAlerts > 0 ? `${stats.activeAlerts} active signal${stats.activeAlerts > 1 ? 's' : ''}` : 'All clear'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#C0392B]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#C0392B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-[#7A7A6E] mb-1">Compliance Rate</p>
                <p className="text-2xl font-bold leading-tight text-gray-900">{`${stats.complianceRate}%`}</p>
                <p className="text-xs text-[#7A7A6E] mt-1.5">
                  {derivedTotalAnimals > 0
                    ? `${derivedHealthyAnimals}/${derivedTotalAnimals} healthy`
                    : detectionHistory.length > 0
                    ? `${detectionSafeCount}/${detectionHistory.length} safe scans`
                    : 'Awaiting records'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#1B5E42]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#1B5E42]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-[#7A7A6E] mb-1">Pending Tasks</p>
                <p className="text-2xl font-bold leading-tight text-gray-900">{stats.pendingTasks}</p>
                {overdueTaskCount > 0 && (
                  <p className="text-xs text-[#C0392B] mt-1.5">{overdueTaskCount} overdue</p>
                )}
                {overdueTaskCount === 0 && stats.pendingTasks > 0 && (
                  <p className="text-xs text-[#4CAF7D] mt-1.5">None overdue</p>
                )}
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#E8A838]/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[#E8A838]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[66%_34%] gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Disease Detection Upload */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 10px rgba(27, 94, 66, 0.05)' }}>
            <CardHeader className="border-b border-[#E5E3DC] px-4 py-3.5">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Activity className="w-5 h-5 text-[#1B5E42]" />
                Disease Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="border-2 border-dashed border-[#4CAF7D]/45 bg-gradient-to-b from-[#FCFDFB] to-[#F7F5F0] rounded-2xl p-5 sm:p-6 min-h-[170px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#1B5E42]/30 hover:bg-[#F0F6F3] transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-[#1B5E42]/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-[#1B5E42]" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Upload Image/Video</p>
                <p className="text-xs text-[#7A7A6E]">JPG, PNG, MP4 • Max 25MB</p>
              </div>
              <Button
                onClick={() => {
                  setActiveNav('detection');
                }}
                className="w-full h-10 bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-xl text-sm"
              >
                Start Detection
              </Button>

              {/* Recent Detections */}
              <div className="pt-2 space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Recent Detections</h4>
                {detectionHistory.length === 0 && (
                  <div className="p-3 bg-[#F7F5F0] rounded-lg text-xs text-[#7A7A6E]">
                    No detections yet. Run a scan to populate history.
                  </div>
                )}
                {detectionHistory.slice(0, 2).map(detection => (
                  <div key={detection.id} className="flex items-center gap-3 p-3 bg-[#F7F5F0] border border-[#ECE7DB] rounded-xl hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-xl">
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
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 10px rgba(27, 94, 66, 0.05)' }}>
            <CardHeader className="border-b border-[#E5E3DC] px-4 py-3.5">
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
            <CardContent className="p-4">
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {todayTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3.5 bg-[#F7F5F0] border border-[#ECE7DB] rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                      <div className="flex items-center gap-4 text-xs text-[#7A7A6E]">
                        <span>{task.animal || 'General'}</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assignee}
                        </span>
                        <Badge className={`${getPriorityStyle(task.priority)} px-2 py-0.5 text-xs rounded-full`}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#1B5E42] rounded-lg">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Health Insights Charts */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 10px rgba(27, 94, 66, 0.05)' }}>
            <CardHeader className="border-b border-[#E5E3DC] px-4 py-3.5">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="w-5 h-5 text-[#1B5E42]" />
                Farm Health Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Disease Detections Over Time</p>
                <div className="h-44 rounded-xl bg-[#FCFBF8] border border-[#E5E3DC] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detectionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECE8DE" />
                      <XAxis dataKey="date" tick={{ fill: '#7A7A6E', fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#7A7A6E', fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="detections" stroke="#1B5E42" strokeWidth={3} dot={{ r: 4, fill: '#1B5E42' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Task Completion Stats</p>
                <div className="h-44 rounded-xl bg-[#FCFBF8] border border-[#E5E3DC] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskCompletionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECE8DE" />
                      <XAxis dataKey="name" tick={{ fill: '#7A7A6E', fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#7A7A6E', fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#E8A838" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disease Alerts Feed */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 10px rgba(27, 94, 66, 0.05)' }}>
            <CardHeader className="border-b border-[#E5E3DC] px-4 py-3.5">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <AlertCircle className="w-5 h-5 text-[#C0392B]" />
                Disease Alerts Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[260px] overflow-y-auto">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 10px rgba(27, 94, 66, 0.05)' }}>
            <CardHeader className="border-b border-[#E5E3DC] px-4 py-3.5">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <Activity className="w-5 h-5 text-[#1B5E42]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <Button className="w-full h-10 justify-start bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg text-sm">
                <Phone className="w-4 h-4 mr-2" />
                Contact Vet
              </Button>
              <Button
                className="w-full h-10 justify-start bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg text-sm"
                onClick={() => {
                  setAppointmentRequestError(null);
                  setIsAppointmentDialogOpen(true);
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Request Vet Appointment
              </Button>
              <Button className="w-full h-10 justify-start bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg text-sm" onClick={() => setActiveNav('reports')}>
                <FileText className="w-4 h-4 mr-2" />
                View Reports
              </Button>
              <Button className="w-full h-10 justify-start bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg text-sm" onClick={() => setActiveNav('compliance')}>
                <Shield className="w-4 h-4 mr-2" />
                Compliance Dashboard
              </Button>
              <Button variant="outline" className="w-full h-10 justify-start border-[#E5E3DC] text-[#7A7A6E] hover:bg-[#F7F5F0] rounded-lg text-sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 10px rgba(27, 94, 66, 0.05)' }}>
            <CardHeader className="border-b border-[#E5E3DC] px-4 py-3.5">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <Calendar className="w-5 h-5 text-[#1B5E42]" />
                Vet Appointment Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {appointmentRequests.slice(0, 4).map((request) => (
                <div key={request.id} className="rounded-xl border border-[#E5E3DC] bg-[#FCFBF8] p-3">
                  <p className="text-sm font-medium text-gray-900">{request.vet_name || 'Assigned Vet'}</p>
                  <p className="text-xs text-[#7A7A6E] mt-1 capitalize">{request.appointment_type.replace('_', ' ')}</p>
                  <p className="text-xs text-[#7A7A6E]">{new Date(request.scheduled_at).toLocaleString()}</p>
                  <div className="mt-2">
                    <Badge className={`${getStatusStyle(request.status)} px-2 py-0.5 rounded-full text-[10px]`}>{request.status}</Badge>
                  </div>
                </div>
              ))}
              {appointmentRequests.length === 0 && (
                <p className="text-xs text-[#7A7A6E]">No requests yet. Use "Request Vet Appointment" to create one.</p>
              )}
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 10px rgba(27, 94, 66, 0.05)' }}>
            <CardHeader className="border-b border-[#E5E3DC] px-4 py-3.5">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <Lightbulb className="w-5 h-5 text-[#1B5E42]" />
                Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 bg-[#F7F5F0] rounded-xl border hover:shadow-sm transition-shadow ${
                      item.severity === 'High'
                        ? 'border-l-4 border-l-[#C0392B] border-[#F0DFDC]'
                        : item.severity === 'Medium'
                        ? 'border-l-4 border-l-[#E8A838] border-[#F1E6CB]'
                        : 'border-l-4 border-l-[#4CAF7D] border-[#DDEEDF]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 mt-0.5 text-[#1B5E42]" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-[#7A7A6E] mt-1">{item.description}</p>
                        </div>
                      </div>
                      <Badge className={`${getSeverityStyle(item.severity)} px-2 py-0.5 text-xs rounded-full`}>{item.severity}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#7A7A6E]">
                      <span className="capitalize">{item.category}</span>
                      <span className="uppercase tracking-wide">{item.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Environmental Conditions */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 10px rgba(27, 94, 66, 0.05)' }}>
            <CardHeader className="border-b border-[#E5E3DC] px-4 py-3.5">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <CloudRain className="w-5 h-5 text-[#1B5E42]" />
                Environmental Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#E8A838]/10 flex items-center justify-center">
                      <Thermometer className="w-4 h-4 text-[#E8A838]" />
                    </div>
                    <span className="text-sm text-[#7A7A6E]">Temperature</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{environmentalData.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#1B5E42]/10 flex items-center justify-center">
                      <Droplet className="w-4 h-4 text-[#1B5E42]" />
                    </div>
                    <span className="text-sm text-[#7A7A6E]">Humidity</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{environmentalData.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#1B5E42]/10 flex items-center justify-center">
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
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 10px rgba(27, 94, 66, 0.05)' }}>
            <CardHeader className="border-b border-[#E5E3DC] px-4 py-3.5">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <Shield className="w-5 h-5 text-[#1B5E42]" />
                Compliance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
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
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 4px 18px rgba(27, 94, 66, 0.08)' }}>
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Activity className="w-5 h-5 text-[#1B5E42]" />
            Disease Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
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

            <div className="border-2 border-dashed border-[#4CAF7D]/50 bg-gradient-to-b from-[#F8FBF9] to-[#F7F5F0] rounded-2xl p-7 sm:p-8 flex flex-col items-center justify-center text-center hover:border-[#1B5E42]/35 hover:bg-[#EEF4F1] transition-colors">
              <div className="w-20 h-20 rounded-2xl bg-[#1B5E42]/10 flex items-center justify-center mb-4">
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
                className="w-full h-12 mt-2 bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-xl text-base"
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
                    {detection.vetNote && (
                      <div className="mt-2 p-2 bg-[#FFF6E5] border border-[#E8A838]/30 rounded-lg text-xs text-[#7A7A6E]">
                        <span className="font-medium text-gray-900">Vet Message:</span> {detection.vetNote}
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

  const renderTasksScreen = () => {
    const pendingList = tasks.filter((t) => (t.status || '').toLowerCase() !== 'completed');
    const completedList = tasks.filter((t) => (t.status || '').toLowerCase() === 'completed');

    const renderTaskRow = (task: FarmTask, isCompleted: boolean) => {
      const mapped = mapTask(task);
      return (
        <div
          key={task.id}
          className={`p-5 rounded-xl border transition-all ${
            isCompleted
              ? 'bg-white border-[#E5E3DC] opacity-70'
              : 'bg-[#F7F5F0] border-transparent hover:shadow-md'
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Checkbox */}
            <button
              onClick={() => handleToggleTaskComplete(task.id, task.status)}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                isCompleted
                  ? 'bg-[#1B5E42] border-[#1B5E42]'
                  : 'border-[#D0CEC8] hover:border-[#1B5E42]'
              }`}
            >
              {isCompleted && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className={`font-medium text-sm leading-snug ${isCompleted ? 'line-through text-[#7A7A6E]' : 'text-gray-900'}`}>
                  {task.title}
                </h4>
                <Badge className={`${getPriorityStyle(mapped.priority)} px-2 py-0.5 text-xs rounded-full flex-shrink-0`}>
                  {mapped.priority}
                </Badge>
              </div>

              {task.description && (
                <p className="text-xs text-[#7A7A6E] mb-2 leading-relaxed">{task.description}</p>
              )}

              <div className="flex items-center gap-3 flex-wrap text-xs text-[#7A7A6E]">
                {task.category && (
                  <span className="flex items-center gap-1 bg-white border border-[#E5E3DC] px-2 py-0.5 rounded-full">
                    {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {isCompleted && task.completed_at
                    ? `Done ${new Date(task.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                    : mapped.dueDate}
                </span>
                {task.assigned_to_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {task.assigned_to_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <ClipboardList className="w-5 h-5 text-[#1B5E42]" />
                Task Management
              </CardTitle>
              <Button className="bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg" onClick={handleAddTask}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Summary pills */}
            <div className="flex gap-3 mt-3">
              <span className="text-xs bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/20 px-3 py-1 rounded-full font-medium">
                {pendingList.length} pending
              </span>
              <span className="text-xs bg-[#1B5E42]/10 text-[#1B5E42] border border-[#1B5E42]/20 px-3 py-1 rounded-full font-medium">
                {completedList.length} completed
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* -- Pending Tasks -- */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E8A838] inline-block" />
                Pending Tasks
                <span className="text-xs font-normal text-[#7A7A6E]">- click the circle to mark done</span>
              </h3>

              {pendingList.length === 0 ? (
                <div className="text-center py-10 text-[#7A7A6E] bg-[#F7F5F0] rounded-xl">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No pending tasks - great work!</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-[#1B5E42]"
                    onClick={handleAddTask}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add one
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingList.map((task) => renderTaskRow(task, false))}
                </div>
              )}
            </div>

            {/* -- Completed Tasks -- */}
            {completedList.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#7A7A6E] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1B5E42] inline-block" />
                  Completed Tasks
                </h3>
                <div className="space-y-3">
                  {completedList.map((task) => renderTaskRow(task, true))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRecordsScreen = () => (
    <div className="space-y-6 w-full overflow-x-hidden">
      <Card className="bg-white rounded-2xl border border-[#E5E3DC] overflow-hidden">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-5 bg-gradient-to-r from-[#F7F5F0] to-white">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="w-5 h-5 text-[#1B5E42]" />
                Farm Health Records
              </CardTitle>
              <p className="text-sm text-[#7A7A6E] mt-1">Track animal profile, treatment history, and compliance readiness in one place.</p>
            </div>

            <div className="inline-flex flex-wrap gap-2 rounded-xl p-1 bg-[#F7F5F0] border border-[#E5E3DC] w-fit">
              <Button
                variant={recordTab === 'animals' ? 'default' : 'ghost'}
                className={`rounded-lg px-4 ${recordTab === 'animals' ? 'bg-[#1B5E42] text-white hover:bg-[#164E36]' : 'text-[#7A7A6E] hover:bg-white'}`}
                onClick={() => setRecordTab('animals')}
              >
                Animals
              </Button>
              <Button
                variant={recordTab === 'treatments' ? 'default' : 'ghost'}
                className={`rounded-lg px-4 ${recordTab === 'treatments' ? 'bg-[#1B5E42] text-white hover:bg-[#164E36]' : 'text-[#7A7A6E] hover:bg-white'}`}
                onClick={() => setRecordTab('treatments')}
              >
                Treatments
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 bg-[#FCFBF8]">
          {recordTab === 'animals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-[#E5E3DC] bg-white p-4">
                  <p className="text-xs text-[#7A7A6E]">Total Animal Records</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{recordsAnimals.length}</p>
                </div>
                <div className="rounded-xl border border-[#E5E3DC] bg-white p-4">
                  <p className="text-xs text-[#7A7A6E]">Healthy Status</p>
                  <p className="text-2xl font-bold text-[#1B5E42] mt-1">{recordsAnimals.filter((a) => a.status === 'Healthy').length}</p>
                </div>
                <div className="rounded-xl border border-[#E5E3DC] bg-white p-4">
                  <p className="text-xs text-[#7A7A6E]">Under Review</p>
                  <p className="text-2xl font-bold text-[#E8A838] mt-1">{recordsAnimals.filter((a) => a.status !== 'Healthy').length}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E3DC] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="min-w-[760px]">
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
                      {recordsAnimals.map((animal) => (
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
                            <Button variant="ghost" size="sm" className="text-[#1B5E42] hover:bg-[#EAF4EF]">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {recordTab === 'treatments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-[#E5E3DC] bg-white p-4">
                  <p className="text-xs text-[#7A7A6E]">Treatment Entries</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{recordsTreatments.length}</p>
                </div>
                <div className="rounded-xl border border-[#E5E3DC] bg-white p-4">
                  <p className="text-xs text-[#7A7A6E]">Marked Safe</p>
                  <p className="text-2xl font-bold text-[#1B5E42] mt-1">{recordsTreatments.filter((t) => t.review.toLowerCase().includes('safe')).length}</p>
                </div>
                <div className="rounded-xl border border-[#E5E3DC] bg-white p-4">
                  <p className="text-xs text-[#7A7A6E]">Needs Follow-up</p>
                  <p className="text-2xl font-bold text-[#C0392B] mt-1">{recordsTreatments.filter((t) => t.review.toLowerCase().includes('not')).length}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E3DC] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="min-w-[920px]">
                    <TableHeader>
                      <TableRow className="bg-[#F7F5F0]">
                        <TableHead className="text-[#7A7A6E]">Animal</TableHead>
                        <TableHead className="text-[#7A7A6E]">Diagnosis</TableHead>
                        <TableHead className="text-[#7A7A6E]">Vet Message</TableHead>
                        <TableHead className="text-[#7A7A6E]">Review</TableHead>
                        <TableHead className="text-[#7A7A6E]">Date</TableHead>
                        <TableHead className="text-[#7A7A6E]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recordsTreatments.map((treatment) => (
                        <TableRow key={treatment.id} className="hover:bg-[#F7F5F0] align-top">
                          <TableCell className="font-medium text-gray-900">{treatment.animal}</TableCell>
                          <TableCell className="text-[#7A7A6E]">{treatment.diagnosis}</TableCell>
                          <TableCell className="text-[#7A7A6E] max-w-[320px] whitespace-normal leading-relaxed">{treatment.vetMessage}</TableCell>
                          <TableCell className="text-[#7A7A6E]">{treatment.review}</TableCell>
                          <TableCell className="text-[#7A7A6E]">{treatment.date}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusStyle(treatment.status)} px-2 py-1 text-xs rounded-full`}>
                              {treatment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
              const alertSeverity = alert.severity.toLowerCase();
              return (
                <div
                  key={alert.id}
                  className="p-5 bg-[#F7F5F0] rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      alertSeverity === 'high' ? 'bg-[#C0392B]/10' :
                      alertSeverity === 'medium' ? 'bg-[#E8A838]/10' :
                      'bg-[#1B5E42]/10'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        alertSeverity === 'high' ? 'text-[#C0392B]' :
                        alertSeverity === 'medium' ? 'text-[#E8A838]' :
                        'text-[#4CAF7D]'
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#1B5E42]"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedAlertForView && (
            <div className="mt-6 rounded-2xl border border-[#E5E3DC] bg-[#FCFBF8] p-5 space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#7A7A6E]">Alert Infographic</p>
                  <h4 className="text-lg font-semibold text-gray-900 mt-1">{selectedAlertForView.title}</h4>
                  <p className="text-sm text-[#7A7A6E] mt-2">{selectedAlertForView.description}</p>
                </div>
                <Badge className={`${getSeverityStyle(selectedAlertForView.severity)} px-3 py-1 rounded-full text-xs h-fit`}>
                  {selectedAlertForView.severity}
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#E5E3DC] bg-white p-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">Overall Farms Trend (last 7 days)</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={alertTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ECE8DE" />
                        <XAxis dataKey="day" tick={{ fill: '#7A7A6E', fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fill: '#7A7A6E', fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="affected_farms" stroke="#C0392B" strokeWidth={3} dot={{ r: 4, fill: '#C0392B' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E5E3DC] bg-white p-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">Regional Impact Snapshot</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={alertImpactBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ECE8DE" />
                        <XAxis dataKey="name" tick={{ fill: '#7A7A6E', fontSize: 10 }} interval={0} angle={-10} textAnchor="end" height={52} />
                        <YAxis allowDecimals={false} tick={{ fill: '#7A7A6E', fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#E8A838" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white border border-[#E5E3DC] p-3">
                  <p className="text-xs text-[#7A7A6E]">What Happened</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedAlertForView.description}</p>
                </div>
                <div className="rounded-xl bg-white border border-[#E5E3DC] p-3 md:col-span-2">
                  <p className="text-xs text-[#7A7A6E]">How To Prevent In Your Farm</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-900">
                    {alertPreventionTips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2">
                        <span className="text-[#1B5E42] mt-[2px]">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
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
              <button
                className="relative text-[#7A7A6E] hover:text-gray-900 transition-colors"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C0392B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-8 top-16 w-[360px] max-w-[90vw] rounded-2xl border border-[#E5E3DC] bg-white shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E3DC] flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Vet Notifications</p>
                    <button
                      type="button"
                      className="text-xs text-[#1B5E42] hover:underline"
                      onClick={markAllNotificationsRead}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto p-3 space-y-2 bg-[#FCFBF8]">
                    {vetNotifications.length === 0 && (
                      <div className="rounded-xl border border-[#E5E3DC] bg-white p-3 text-sm text-[#7A7A6E]">
                        No vet messages yet.
                      </div>
                    )}

                    {vetNotifications.map((note) => {
                      const isUnread = !readNotificationIds.includes(note.id);
                      return (
                        <button
                          key={note.id}
                          type="button"
                          onClick={() => markNotificationRead(note.id)}
                          className={`w-full text-left rounded-xl border p-3 transition-colors ${
                            isUnread
                              ? 'border-[#E8A838]/40 bg-[#FFF9EA]'
                              : 'border-[#E5E3DC] bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900">{note.title}</p>
                            <Badge className={`${getSeverityStyle(note.severity)} px-2 py-0.5 text-[10px] rounded-full`}>
                              {note.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#7A7A6E] mt-1 line-clamp-2">{note.message}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-[#7A7A6E]">
                            <span>{note.timestamp}</span>
                            <span className="uppercase tracking-wide">{note.source === 'vet_note' ? 'Vet Note' : 'Vet Alert'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <ProfileMenu
                fallbackName={userName || 'Farm Owner'}
                fallbackRole="Farm Owner"
                fallbackEmail={userEmail}
                onEditProfile={() => onNavigate?.('profile')}
                onLogout={() => onLogout?.()}
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>

      <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
        <DialogContent className="sm:max-w-3xl border border-[#E5E3DC] rounded-2xl bg-[#FCFBF8] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1B5E42]" />
              Farm Risk Assessment QnA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs">
              {[1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={`px-3 py-1 rounded-full border ${riskStep === step ? 'bg-[#1B5E42] text-white border-[#1B5E42]' : 'bg-white text-[#7A7A6E] border-[#E5E3DC]'}`}
                >
                  Step {step}
                </span>
              ))}
            </div>

            {riskStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Farm Name</label>
                  <input
                    value={riskForm.farm_name}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, farm_name: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                    placeholder="Enter farm name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Number of Animals</label>
                  <input
                    type="number"
                    min={1}
                    value={riskForm.animal_count || ''}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, animal_count: Number(e.target.value || 0) }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                    placeholder="e.g. 120"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Village / City</label>
                  <input
                    value={riskForm.location_city_village}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, location_city_village: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                    placeholder="Farm location"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">State</label>
                  <input
                    value={riskForm.location_state}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, location_state: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                    placeholder="State"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Type of Animals</label>
                  <div className="flex flex-wrap gap-2">
                    {animalTypeOptions.map((option) => {
                      const checked = riskForm.animal_types.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`px-3 py-1 rounded-full text-xs border ${checked ? 'bg-[#1B5E42] text-white border-[#1B5E42]' : 'bg-white text-[#7A7A6E] border-[#E5E3DC]'}`}
                          onClick={() => {
                            setRiskForm((prev) => ({
                              ...prev,
                              animal_types: checked
                                ? prev.animal_types.filter((item) => item !== option)
                                : [...prev.animal_types, option],
                            }));
                          }}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {riskStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Water Source</label>
                  <select
                    value={riskForm.water_source}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, water_source: e.target.value as RiskProfileQnA['water_source'] }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                  >
                    <option value="well">Well</option>
                    <option value="river">River</option>
                    <option value="municipal">Municipal</option>
                    <option value="borewell">Borewell</option>
                    <option value="mixed">Mixed</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Feeding System</label>
                  <select
                    value={riskForm.feeding_system}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, feeding_system: e.target.value as RiskProfileQnA['feeding_system'] }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                  >
                    <option value="manual">Manual</option>
                    <option value="automated">Automated</option>
                    <option value="grazing">Grazing</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Waste Management</label>
                  <select
                    value={riskForm.waste_management}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, waste_management: e.target.value as RiskProfileQnA['waste_management'] }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                  >
                    <option value="scientific">Scientific</option>
                    <option value="basic">Basic</option>
                    <option value="open_disposal">Open Disposal</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Veterinary Services</label>
                  <select
                    value={riskForm.vet_service_usage}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, vet_service_usage: e.target.value as RiskProfileQnA['vet_service_usage'] }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                  >
                    <option value="frequent">Frequent</option>
                    <option value="rare">Rare</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            )}

            {riskStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Vaccination Status</label>
                  <select
                    value={riskForm.vaccination_status}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, vaccination_status: e.target.value as RiskProfileQnA['vaccination_status'] }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                  >
                    <option value="regular">Regular</option>
                    <option value="irregular">Irregular</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">Recent Disease History</label>
                  <select
                    value={riskForm.recent_disease ? 'yes' : 'no'}
                    onChange={(e) => setRiskForm((prev) => ({ ...prev, recent_disease: e.target.value === 'yes' }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {riskForm.recent_disease && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 mb-1 block">Disease Details</label>
                    <textarea
                      value={riskForm.recent_disease_details || ''}
                      onChange={(e) => setRiskForm((prev) => ({ ...prev, recent_disease_details: e.target.value }))}
                      className="w-full min-h-24 px-3 py-2 rounded-lg border border-[#E5E3DC] bg-white resize-none"
                      placeholder="Mention disease name, when it occurred, and affected groups"
                    />
                  </div>
                )}

                {riskInsights && (
                  <div className="md:col-span-2 bg-[#F7F5F0] border border-[#E5E3DC] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">Current Risk Snapshot</p>
                      <Badge className={`${getRiskLevelStyle(riskInsights.risk_level)} px-2 py-1 rounded-full text-xs`}>
                        {riskInsights.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#7A7A6E]">Risk score: {riskInsights.risk_score}/100</p>
                  </div>
                )}
              </div>
            )}

            {riskFormError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {riskFormError}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={riskStep === 1 || isSavingRisk}
                  onClick={() => {
                    setRiskFormError(null);
                    setRiskStep((prev) => Math.max(1, prev - 1));
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingRisk}
                  onClick={() => {
                    void saveRiskDraft();
                  }}
                >
                  Save Draft
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingRisk}
                  onClick={() => {
                    setIsRiskDialogOpen(false);
                    setRiskFormError(null);
                  }}
                >
                  Cancel
                </Button>

                {riskStep < 3 ? (
                  <Button
                    type="button"
                    className="bg-[#1B5E42] hover:bg-[#164E36] text-white"
                    disabled={isSavingRisk}
                    onClick={() => {
                      const stepError = validateRiskStep();
                      if (stepError) {
                        setRiskFormError(stepError);
                        return;
                      }
                      setRiskFormError(null);
                      setRiskStep((prev) => Math.min(3, prev + 1));
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="bg-[#1B5E42] hover:bg-[#164E36] text-white"
                    disabled={isSavingRisk}
                    onClick={() => {
                      void submitRiskProfile();
                    }}
                  >
                    {isSavingRisk ? 'Submitting...' : 'Submit Assessment'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-xl border border-[#E5E3DC] rounded-2xl bg-[#FCFBF8]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1B5E42]" />
              Request Vet Appointment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 mb-1 block">Select Vet</label>
              <select
                value={appointmentDraft.vet_user_id}
                onChange={(e) => setAppointmentDraft((prev) => ({ ...prev, vet_user_id: e.target.value }))}
                className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
              >
                <option value="">Choose vet</option>
                {assignedVets.map((vet) => (
                  <option key={vet.vet_user_id} value={vet.vet_user_id}>
                    {vet.vet_name}{vet.email ? ` (${vet.email})` : ''}
                  </option>
                ))}
              </select>
              {assignedVets.length > 0 && (
                <p className="text-xs text-[#7A7A6E] mt-1">
                  Appointment requests are currently routed to: {PRIMARY_VET_EMAIL}
                </p>
              )}
              {assignedVets.length === 0 && (
                <p className="text-xs text-[#C0392B] mt-1">No veterinarian is assigned to your farm yet. Ask admin/vet to assign first.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Appointment Type</label>
                <select
                  value={appointmentDraft.appointment_type}
                  onChange={(e) =>
                    setAppointmentDraft((prev) => ({
                      ...prev,
                      appointment_type: e.target.value as AppointmentRequestDraft['appointment_type'],
                    }))
                  }
                  className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                >
                  <option value="routine">Routine</option>
                  <option value="emergency">Emergency</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="vaccination">Vaccination</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Preferred Date & Time</label>
                <input
                  type="datetime-local"
                  value={appointmentDraft.preferred_datetime}
                  onChange={(e) => setAppointmentDraft((prev) => ({ ...prev, preferred_datetime: e.target.value }))}
                  className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 mb-1 block">Reason / Notes</label>
              <textarea
                rows={4}
                value={appointmentDraft.reason_notes}
                onChange={(e) => setAppointmentDraft((prev) => ({ ...prev, reason_notes: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] bg-white"
                placeholder="Describe symptoms, urgency, and requested support"
              />
            </div>

            {appointmentRequestError && <p className="text-sm text-[#C0392B]">{appointmentRequestError}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAppointmentDialogOpen(false)}>Cancel</Button>
              <Button
                className="bg-[#1B5E42] hover:bg-[#164E36] text-white"
                disabled={isSavingAppointmentRequest}
                onClick={async () => {
                  setAppointmentRequestError(null);

                  if (!appointmentDraft.vet_user_id || !appointmentDraft.preferred_datetime || !appointmentDraft.reason_notes.trim()) {
                    setAppointmentRequestError('Please fill all required fields.');
                    return;
                  }

                  const selectedVet = assignedVets.find((vet) => vet.vet_user_id === appointmentDraft.vet_user_id);
                  if (!selectedVet) {
                    setAppointmentRequestError('Please select a valid veterinarian.');
                    return;
                  }

                  setIsSavingAppointmentRequest(true);
                  try {
                    const created = await farmOwnerService.createAppointmentRequest({
                      vet_user_id: appointmentDraft.vet_user_id,
                      appointment_type: appointmentDraft.appointment_type,
                      preferred_datetime: new Date(appointmentDraft.preferred_datetime).toISOString(),
                      reason_notes: appointmentDraft.reason_notes.trim(),
                    });

                    setAppointmentRequests((prev) => [created, ...prev]);
                    setAppointmentDraft({
                      vet_user_id: selectedVet.vet_user_id,
                      appointment_type: 'routine',
                      preferred_datetime: '',
                      reason_notes: '',
                    });
                    setIsAppointmentDialogOpen(false);
                  } catch (error) {
                    setAppointmentRequestError(error instanceof Error ? error.message : 'Failed to submit appointment request.');
                  } finally {
                    setIsSavingAppointmentRequest(false);
                  }
                }}
              >
                {isSavingAppointmentRequest ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg border border-[#E5E3DC] rounded-2xl bg-[#FCFBF8]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add Task</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreateTask();
            }}
          >
            <div>
              <label className="text-sm font-medium text-gray-900 mb-1 block">Task Title</label>
              <input
                value={taskForm.title}
                onChange={(e) => {
                  setTaskForm((prev) => ({ ...prev, title: e.target.value }));
                  if (taskFormError) setTaskFormError(null);
                }}
                placeholder="e.g. Vaccination Round for Batch A"
                className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 mb-1 block">Description</label>
              <textarea
                value={taskForm.description}
                onChange={(e) => {
                  setTaskForm((prev) => ({ ...prev, description: e.target.value }));
                  if (taskFormError) setTaskFormError(null);
                }}
                placeholder="Optional details"
                className="w-full min-h-24 px-3 py-2 rounded-lg border border-[#E5E3DC] bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => {
                    setTaskForm((prev) => ({ ...prev, priority: e.target.value }));
                    if (taskFormError) setTaskFormError(null);
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                >
                  <option value="high">High</option>
                  <option value="moderate">Moderate</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Animal</label>
                <select
                  value={taskForm.animal}
                  onChange={(e) => {
                    setTaskForm((prev) => ({ ...prev, animal: e.target.value }));
                    if (taskFormError) setTaskFormError(null);
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-[#E5E3DC] bg-white"
                >
                  <option value="general">General</option>
                  <option value="pig">Pig</option>
                  <option value="poultry">Poultry</option>
                  <option value="cattle">Cattle</option>
                </select>
              </div>
            </div>

            {taskFormError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {taskFormError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTaskDialogOpen(false);
                  resetTaskForm();
                  setTaskFormError(null);
                }}
                type="button"
              >
                Cancel
              </Button>
              <Button className="bg-[#1B5E42] hover:bg-[#164E36] text-white" type="submit" disabled={isCreatingTask}>
                {isCreatingTask ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { FarmOwnerDashboard };
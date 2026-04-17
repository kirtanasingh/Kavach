import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
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
  MapPin,
  Phone,
  User,
  Edit,
  RefreshCw
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
import {
  vetService,
  type FarmerDirectoryItem,
  type FarmSummaryForVet,
  type Prescription,
  type VetAlert,
  type VetAppointment,
  type VetDashboardSummary,
} from '../services/vetService';
import { ProfileMenu } from './ProfileMenu';

interface VetDashboardProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName: string;
  userEmail?: string;
}

type VetAlertView = {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
};

type VlmStatusFilter = 'pending_review' | 'safe' | 'not_safe' | 'other' | 'all';

// Mock seed keeps Alerts tab usable before full vet_alerts workflows are enabled per account.
const mockVetAlerts: VetAlertView[] = [
  {
    id: 'mock-alert-1',
    type: 'amr_risk',
    severity: 'critical',
    title: 'AMR risk threshold exceeded',
    message: 'Three farms crossed antibiotic class diversity threshold this week.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    is_read: false,
  },
  {
    id: 'mock-alert-2',
    type: 'overdue_review',
    severity: 'high',
    title: 'Overdue review queue',
    message: '5 VLM detections are pending veterinarian decision for over 24 hours.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    is_read: false,
  },
  {
    id: 'mock-alert-3',
    type: 'withdrawal_violation',
    severity: 'medium',
    title: 'Potential withdrawal violation',
    message: 'Milk collection was attempted before safe-after date on one farm.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    is_read: true,
  },
  {
    id: 'mock-alert-4',
    type: 'routine',
    severity: 'low',
    title: 'Routine follow-up due',
    message: 'Monthly farm biosecurity follow-up is due in 2 days.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    is_read: true,
  },
];

// Mock appointments support filter/sort UI while backend schedules scale up.
const mockAppointmentSeed = [
  {
    id: 'mock-appt-1',
    farm: 'Green Valley Farm',
    farmer: 'Rohan Patel',
    appointment_type: 'routine',
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    status: 'scheduled',
  },
  {
    id: 'mock-appt-2',
    farm: 'Sunrise Poultry Unit',
    farmer: 'Neha Singh',
    appointment_type: 'emergency',
    scheduled_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: 'completed',
  },
  {
    id: 'mock-appt-3',
    farm: 'Riverbank Cattle Hub',
    farmer: 'Imran Khan',
    appointment_type: 'follow-up',
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    status: 'scheduled',
  },
  {
    id: 'mock-appt-4',
    farm: 'Metro Agro Farm',
    farmer: 'Aarti Verma',
    appointment_type: 'vaccination',
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 50).toISOString(),
    status: 'cancelled',
  },
];

const medicineChecklist = [
  'Amoxicillin',
  'Oxytetracycline',
  'Florfenicol',
  'Tylosin',
  'Enrofloxacin',
  'Ceftiofur',
  'Ivermectin',
  'Albendazole',
];

const vaccineChecklist = [
  'FMD Vaccine',
  'HS Vaccine',
  'Black Quarter Vaccine',
  'Newcastle Disease Vaccine',
  'IBD Vaccine',
  'Classical Swine Fever Vaccine',
  'Brucella S19 Vaccine',
];

export function VetDashboard({ onNavigate, onLogout, userName, userEmail }: VetDashboardProps) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [summary, setSummary] = useState<VetDashboardSummary | null>(null);
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [alerts, setAlerts] = useState<VetAlert[]>([]);
  const [farms, setFarms] = useState<FarmSummaryForVet[]>([]);
  const [farmersDirectory, setFarmersDirectory] = useState<FarmerDirectoryItem[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersError, setFarmersError] = useState('');
  const [farmersLastUpdatedAt, setFarmersLastUpdatedAt] = useState<string | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerDirectoryItem | null>(null);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [selectedVLM, setSelectedVLM] = useState<number | null>(null);
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [showCreatePrescription, setShowCreatePrescription] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'active' | 'resolved'>('active');
  const [contentFade, setContentFade] = useState(true);
  const [bellShake, setBellShake] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingVlmNotifications, setPendingVlmNotifications] = useState<VetDetectionItem[]>([]);
  const [vlmQueue, setVlmQueue] = useState<VetDetectionItem[]>([]);
  const [vlmStatusFilter, setVlmStatusFilter] = useState<VlmStatusFilter>('pending_review');
  const [isNotSafeDialogOpen, setIsNotSafeDialogOpen] = useState(false);
  const [notSafeDetectionId, setNotSafeDetectionId] = useState<number | null>(null);
  const [notSafeMessage, setNotSafeMessage] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [cases, setCases] = useState<VetCaseItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPayload>({
    overall_reviews: [],
    by_species: [],
    trend: [],
  });
  const [loadingData, setLoadingData] = useState(false);
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<'all' | 'requested' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [appointmentSort, setAppointmentSort] = useState<'asc' | 'desc'>('asc');
  const [localAlerts, setLocalAlerts] = useState<VetAlertView[]>(mockVetAlerts);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [appointmentActionLoadingId, setAppointmentActionLoadingId] = useState<string>('');
  const [appointmentActionError, setAppointmentActionError] = useState<string>('');
  const [prescriptionError, setPrescriptionError] = useState<string>('');
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [selectedMedicineName, setSelectedMedicineName] = useState('');
  const [selectedVaccineNames, setSelectedVaccineNames] = useState<string[]>([]);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    dose: '',
    frequency: 'Once daily',
    duration_days: 5,
    route: 'oral',
    withdrawal_days: 0,
    comments: '',
  });
  
  // Count-up animation for metrics
  const [animatedStats, setAnimatedStats] = useState({
    activeCases: 0,
    pendingReviews: 0,
    appointmentsToday: 0,
    farmsUnderCare: 0
  });

  const loadFarmersDirectory = useCallback(async () => {
    setFarmersLoading(true);
    setFarmersError('');
    try {
      const farmers = await vetService.getFarmersDirectory();
      setFarmersDirectory(farmers);
      setFarmersLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setFarmersError(error instanceof Error ? error.message : 'Failed to load farm owners.');
    } finally {
      setFarmersLoading(false);
    }
  }, []);

  const loadVetData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [queueRows, caseRows, analyticsRows, sum, appts, rxList, alertList, farmList] = await Promise.all([
        fetchVetDetectionQueue(vlmStatusFilter),
        fetchVetCases(),
        fetchVetAnalytics(),
        vetService.getSummary(),
        vetService.getAppointments({ limit: 200 }),
        vetService.getPrescriptions({ limit: 200 }),
        vetService.getAlerts({ unread_only: false, limit: 25 }),
        vetService.getMyFarms(),
      ]);
      setVlmQueue(queueRows);
      setCases(caseRows);
      setAnalytics(analyticsRows);
      setSummary(sum);
      setAppointments(appts);
      setPrescriptions(rxList);
      setAlerts(alertList);
      setFarms(farmList);
    } catch {
      setVlmQueue([]);
      setCases([]);
      setAnalytics({ overall_reviews: [], by_species: [], trend: [] });
      setSummary(null);
      setAppointments([]);
      setPrescriptions([]);
      setAlerts([]);
      setFarms([]);
    } finally {
      setLoadingData(false);
    }
  }, [vlmStatusFilter]);

  const loadPendingVlmNotifications = useCallback(async () => {
    try {
      const pendingRows = await fetchVetDetectionQueue('pending_review');
      setPendingVlmNotifications(pendingRows);
    } catch {
      setPendingVlmNotifications([]);
    }
  }, []);

  useEffect(() => {
    loadVetData();
    loadFarmersDirectory();
    loadPendingVlmNotifications();
  }, [loadFarmersDirectory, loadPendingVlmNotifications, loadVetData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadPendingVlmNotifications();
    }, 15000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPendingVlmNotifications();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadPendingVlmNotifications]);

  useEffect(() => {
    if (activeNav !== 'farmers') return;

    loadFarmersDirectory();
    const intervalId = window.setInterval(() => {
      loadFarmersDirectory();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [activeNav, loadFarmersDirectory]);

  useEffect(() => {
    if (!['dashboard', 'vlm-review', 'cases'].includes(activeNav)) return;

    const intervalId = window.setInterval(() => {
      loadVetData();
    }, 7000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadVetData();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [activeNav, loadVetData]);

  const formatReviewLabel = (value?: string): string => {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'safe') return 'Safe';
    if (normalized === 'not_safe') return 'Not Safe';
    if (normalized === 'other') return 'Needs Manual Review';
    return 'Pending';
  };

  useEffect(() => {
    if (activeNav !== 'farmers') return;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadFarmersDirectory();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [activeNav, loadFarmersDirectory]);

  const stats = {
    activeCases: cases.filter((item) => item.status !== 'closed').length,
    pendingReviews: summary?.pending_reviews ?? vlmQueue.length,
    appointmentsToday: summary?.todays_appointments ?? appointments.length,
    farmsUnderCare: summary?.assigned_farms ?? farms.length,
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

  const unreadNotifications = pendingVlmNotifications.length;
  const notificationPreview = pendingVlmNotifications.slice(0, 6);

  const farmNameById = farms.reduce<Record<string, string>>((acc, farm) => {
    acc[farm.farm_id] = farm.farm_name;
    return acc;
  }, {});

  const activeCases = cases.filter((item) => item.status !== 'closed');

  const appointmentsToday = appointments
    .filter((appointment) => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const scheduled = new Date(appointment.scheduled_at);
      return scheduled >= start && scheduled < end;
    })
    .map((appointment) => ({
    id: appointment.id,
    time: new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    farm: farmNameById[appointment.farm_id] || 'Assigned Farm',
    farmer: '',
    type: appointment.appointment_type,
    status: appointment.status,
    location: appointment.location_text || '',
    distance: '',
    duration: String(appointment.duration_minutes || 0),
  }));

  const handleVLMAccept = async (detectionId: number) => {
    try {
      await submitVetDetectionReview(detectionId, 'safe');
      setVlmQueue((prev) => prev.filter((item) => item.detection_id !== detectionId));
      await loadVetData();
      await loadPendingVlmNotifications();
    } catch {
      alert('Failed to save safe review. Please try again.');
    }
  };

  const handleVLMCorrect = async (detectionId: number) => {
    setNotSafeDetectionId(detectionId);
    setNotSafeMessage('');
    setIsNotSafeDialogOpen(true);
  };

  const submitNotSafeReview = async () => {
    if (!notSafeDetectionId) return;
    if (!notSafeMessage.trim()) {
      alert('Please write a message for the farmer before marking Not Safe.');
      return;
    }

    try {
      setReviewSubmitting(true);
      await submitVetDetectionReview(notSafeDetectionId, 'not_safe', notSafeMessage.trim());
      setVlmQueue((prev) => prev.filter((item) => item.detection_id !== notSafeDetectionId));
      setIsNotSafeDialogOpen(false);
      setNotSafeDetectionId(null);
      setNotSafeMessage('');
      await loadVetData();
      await loadPendingVlmNotifications();
    } catch {
      alert('Failed to submit Not Safe review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const recentPrescriptions = prescriptions.map((prescription) => ({
    id: prescription.id,
    farm: farmNameById[prescription.farm_id] || 'Assigned Farm',
    farmer: '',
    animal: prescription.animal_id || '-',
    diagnosis: prescription.diagnosis,
    drug: prescription.medicine_name,
    dose: prescription.dose,
    frequency: prescription.frequency || '-',
    duration: prescription.duration_days ? `${prescription.duration_days} days` : '-',
    date: prescription.created_at,
    withdrawal: String(prescription.withdrawal_days),
    status: prescription.status,
    issued: new Date(prescription.prescribed_on).toLocaleDateString(),
  }));

  const unifiedAlerts: VetAlertView[] = [
    ...alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      severity: ((alert.severity || 'medium').toLowerCase() as VetAlertView['severity']),
      title: alert.title,
      message: alert.message || 'No details provided.',
      timestamp: alert.created_at,
      is_read: alert.is_read,
    })),
    ...localAlerts,
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const appointmentRows = (
    appointments.length > 0
      ? appointments.map((appointment) => ({
          id: appointment.id,
          farm_id: appointment.farm_id,
          farm: farmNameById[appointment.farm_id] || 'Assigned Farm',
          farmer: farms.find((farm) => farm.farm_id === appointment.farm_id)?.owner_name || 'Farm Owner',
          appointment_type: appointment.appointment_type,
          scheduled_at: appointment.scheduled_at,
          status: appointment.status,
        }))
      : mockAppointmentSeed.map((item) => ({ ...item, farm_id: '' }))
  )
    .filter((row) => (appointmentStatusFilter === 'all' ? true : row.status.toLowerCase() === appointmentStatusFilter))
    .sort((a, b) => {
      const delta = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      return appointmentSort === 'asc' ? delta : -delta;
    });

  const appointmentsForPrescription = appointmentRows.filter((row) => row.status.toLowerCase() === 'scheduled');

  const handleAppointmentStatusUpdate = async (appointmentId: string, nextStatus: 'scheduled' | 'completed' | 'cancelled') => {
    setAppointmentActionError('');
    setAppointmentActionLoadingId(appointmentId);
    try {
      await vetService.updateAppointment(appointmentId, { status: nextStatus });
      await loadVetData();
    } catch (error) {
      setAppointmentActionError(error instanceof Error ? error.message : 'Failed to update appointment status.');
    } finally {
      setAppointmentActionLoadingId('');
    }
  };

  const handleCreatePrescription = async () => {
    setPrescriptionError('');
    const selectedAppointment = appointmentsForPrescription.find((row) => row.id === selectedAppointmentId);
    if (!selectedAppointment) {
      setPrescriptionError('Select an appointment first.');
      return;
    }
    if (!prescriptionForm.diagnosis.trim() || !selectedMedicineName || !prescriptionForm.dose.trim()) {
      setPrescriptionError('Diagnosis, medicine, and dose are required.');
      return;
    }

    setIsSavingPrescription(true);
    try {
      await vetService.createPrescription({
        appointment_id: selectedAppointment.id,
        farm_id: selectedAppointment.farm_id,
        diagnosis: prescriptionForm.diagnosis.trim(),
        medicine_name: selectedMedicineName,
        dose: prescriptionForm.dose.trim(),
        frequency: prescriptionForm.frequency,
        duration_days: prescriptionForm.duration_days,
        route: prescriptionForm.route,
        withdrawal_days: prescriptionForm.withdrawal_days,
        comments: [
          prescriptionForm.comments.trim(),
          selectedVaccineNames.length ? `Vaccines checklist: ${selectedVaccineNames.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
      });

      setPrescriptionForm({
        diagnosis: '',
        dose: '',
        frequency: 'Once daily',
        duration_days: 5,
        route: 'oral',
        withdrawal_days: 0,
        comments: '',
      });
      setSelectedMedicineName('');
      setSelectedVaccineNames([]);
      await loadVetData();
    } catch (error) {
      setPrescriptionError(error instanceof Error ? error.message : 'Failed to create prescription.');
    } finally {
      setIsSavingPrescription(false);
    }
  };

  const farmersRiskRows = [...farmersDirectory]
    .sort((a, b) => a.farmer_name.localeCompare(b.farmer_name))
    .map((row) => ({
      ...row,
      riskLevel: (
        row.risk_level ||
        ((row.risk_score ?? 0) >= 70 ? 'high' : (row.risk_score ?? 0) >= 40 ? 'medium' : 'low')
      ).toLowerCase(),
    }));

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
    switch ((severity || '').toLowerCase()) {
      case 'critical':
        return 'bg-[#C0392B] text-white';
      case 'high':
        return 'bg-[#C0392B] text-white';
      case 'moderate':
      case 'medium':
        return 'bg-[#E8A838] text-white';
      case 'low':
        return 'bg-[#4CAF7D] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'requested':
        return 'bg-[#E8A838] text-white';
      case 'scheduled':
        return 'bg-[#1B5E42] text-white';
      case 'completed':
        return 'bg-[#4CAF7D] text-white';
      case 'cancelled':
        return 'bg-[#C0392B] text-white';
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
      <Card className="rounded-2xl border border-[#E5E3DC] bg-[linear-gradient(135deg,#FFFFFF_0%,#FCFBF8_55%,#F3EFE6_100%)] shadow-sm">
        <CardContent className="px-5 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#7A7A6E]">Daily Operations</p>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Veterinary Command Overview</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#1B5E42]/10 text-[#1B5E42] border border-[#1B5E42]/20">Live Monitoring</Badge>
              <Badge className="bg-[#E8A838]/10 text-[#9C6E0D] border border-[#E8A838]/20">Review Sync: 7s</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-white rounded-2xl border border-[#E5E3DC] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] md:text-xs uppercase tracking-wide text-[#7A7A6E] truncate">Active Cases</p>
                <p className="text-2xl font-bold text-gray-900 leading-none mt-1">{stats.activeCases}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#1B5E42]/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-[#1B5E42]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] md:text-xs uppercase tracking-wide text-[#7A7A6E] truncate">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900 leading-none mt-1">{stats.pendingReviews}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#E8A838]/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-[#E8A838]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] md:text-xs uppercase tracking-wide text-[#7A7A6E] truncate">Appointments Today</p>
                <p className="text-2xl font-bold text-gray-900 leading-none mt-1">{stats.appointmentsToday}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#4CAF7D]/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-[#4CAF7D]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] md:text-xs uppercase tracking-wide text-[#7A7A6E] truncate">Farms Under Care</p>
                <p className="text-2xl font-bold text-gray-900 leading-none mt-1">{stats.farmsUnderCare}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#1B5E42]/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-[#1B5E42]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - 65% */}
        <div className="space-y-6 xl:col-span-2">
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

        </div>
      </div>
    </div>
  );

  const renderVlmReview = () => (
    <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
      <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Activity className="w-5 h-5 text-[#1B5E42]" />
            VLM Review
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={vlmStatusFilter}
              onChange={(event) => setVlmStatusFilter(event.target.value as VlmStatusFilter)}
              className="h-9 rounded-lg border border-[#E5E3DC] bg-white px-2 text-sm"
            >
              <option value="pending_review">Pending</option>
              <option value="safe">Safe</option>
              <option value="not_safe">Not Safe</option>
              <option value="other">Needs Manual Review</option>
              <option value="all">All</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => loadVetData()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-[#F7F5F0]">
              <TableHead>Detection</TableHead>
              <TableHead>Case Details</TableHead>
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
                <TableCell>
                  <div className="space-y-1 text-xs text-[#7A7A6E]">
                    <div><span className="font-medium text-gray-900">Case:</span> #{item.case_id ?? item.detection_id}</div>
                    <div><span className="font-medium text-gray-900">Species:</span> {item.species}</div>
                    <div><span className="font-medium text-gray-900">Farmer:</span> {item.farmer_name || 'Unknown Farmer'}</div>
                    <div><span className="font-medium text-gray-900">Animal:</span> {item.animal_name || 'Unknown Animal'}</div>
                    <div><span className="font-medium text-gray-900">Scanned:</span> {new Date(item.created_at).toLocaleString()}</div>
                  </div>
                </TableCell>
                <TableCell>{Math.round((item.confidence || 0) * 100)}%</TableCell>
                <TableCell>{formatReviewLabel(item.review_status)}</TableCell>
                <TableCell>{item.case_status || 'open'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleVLMAccept(item.detection_id)} className="bg-[#4CAF7D] hover:bg-[#3D9B68] text-white" disabled={(item.review_status || 'pending') !== 'pending'}>
                      Safe
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleVLMCorrect(item.detection_id)} className="border-[#C0392B] text-[#C0392B]" disabled={(item.review_status || 'pending') !== 'pending'}>
                      Not Safe
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loadingData && vlmQueue.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#7A7A6E] py-8">
                  No detections found for the selected filter.
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

  const renderAlerts = () => {
    const displayed = alertFilter === 'active' ? unifiedAlerts.filter((item) => !item.is_read) : unifiedAlerts;

    return (
      <div className="space-y-6">
        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <AlertTriangle className="w-5 h-5 text-[#1B5E42]" />
                Alert Feed
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant={alertFilter === 'active' ? 'default' : 'outline'} onClick={() => setAlertFilter('active')}>
                  Unread
                </Button>
                <Button size="sm" variant={alertFilter === 'resolved' ? 'default' : 'outline'} onClick={() => setAlertFilter('resolved')}>
                  All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {displayed.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-[#E5E3DC] bg-[#FCFBF8] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                      <Badge className={`${getSeverityStyle(alert.severity)} px-2 py-0.5 text-xs rounded-full`}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.is_read ? 'Read' : 'Unread'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#7A7A6E] mt-1 capitalize">{alert.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-[#5F5F53] mt-2">{alert.message}</p>
                  </div>
                  <p className="text-xs text-[#7A7A6E] whitespace-nowrap">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {displayed.length === 0 && <p className="text-sm text-[#7A7A6E]">No alerts in this view.</p>}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAppointments = () => (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="w-5 h-5 text-[#1B5E42]" />
              Appointments
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={appointmentStatusFilter}
                onChange={(e) => setAppointmentStatusFilter(e.target.value as typeof appointmentStatusFilter)}
                className="h-9 rounded-lg border border-[#E5E3DC] px-3 text-sm"
              >
                <option value="all">All Status</option>
                <option value="requested">Requested</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={appointmentSort}
                onChange={(e) => setAppointmentSort(e.target.value as typeof appointmentSort)}
                className="h-9 rounded-lg border border-[#E5E3DC] px-3 text-sm"
              >
                <option value="asc">Date ↑</option>
                <option value="desc">Date ↓</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {appointmentActionError && <p className="text-sm text-[#C0392B]">{appointmentActionError}</p>}
          {appointmentRows.map((row) => (
            <div key={row.id} className="rounded-xl border border-[#E5E3DC] bg-[#FCFBF8] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{row.farm}</p>
                  <p className="text-xs text-[#7A7A6E] mt-1">Farmer: {row.farmer}</p>
                  <p className="text-xs text-[#7A7A6E]">Type: {row.appointment_type}</p>
                  <p className="text-xs text-[#7A7A6E]">{new Date(row.scheduled_at).toLocaleString()}</p>
                </div>
                <Badge className={`${getStatusStyle(row.status)} px-2 py-1 text-xs rounded-full`}>{row.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {row.status.toLowerCase() === 'requested' && (
                  <Button
                    size="sm"
                    className="bg-[#1B5E42] hover:bg-[#164E36] text-white"
                    disabled={appointmentActionLoadingId === row.id}
                    onClick={() => handleAppointmentStatusUpdate(row.id, 'scheduled')}
                  >
                    {appointmentActionLoadingId === row.id ? 'Updating...' : 'Accept & Add to Schedule'}
                  </Button>
                )}
                {row.status.toLowerCase() === 'scheduled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#4CAF7D] text-[#1B5E42]"
                    disabled={appointmentActionLoadingId === row.id}
                    onClick={() => handleAppointmentStatusUpdate(row.id, 'completed')}
                  >
                    Mark Completed
                  </Button>
                )}
                {row.status.toLowerCase() !== 'cancelled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#C0392B] text-[#C0392B]"
                    disabled={appointmentActionLoadingId === row.id}
                    onClick={() => handleAppointmentStatusUpdate(row.id, 'cancelled')}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
          {appointmentRows.length === 0 && <p className="text-sm text-[#7A7A6E]">No appointments found.</p>}
        </CardContent>
      </Card>
    </div>
  );

  const renderPrescriptions = () => {
    const selectedAppointment = appointmentsForPrescription.find((row) => row.id === selectedAppointmentId);
    const selectedFarm = farms.find((farm) => farm.farm_id === selectedAppointment?.farm_id);

    return (
      <div className="space-y-6">
        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Pill className="w-5 h-5 text-[#1B5E42]" />
              Create Prescription from Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <select
              value={selectedAppointmentId}
              onChange={(e) => setSelectedAppointmentId(e.target.value)}
              className="w-full h-10 rounded-lg border border-[#E5E3DC] px-3 text-sm"
            >
              <option value="">Select appointment</option>
              {appointmentsForPrescription.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.farm} · {row.appointment_type} · {new Date(row.scheduled_at).toLocaleString()}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E5E3DC] bg-[#FCFBF8] p-3">
                <p className="text-xs text-[#7A7A6E]">Farm</p>
                <p className="text-sm font-medium text-gray-900">{selectedAppointment?.farm || 'Auto-fill after selection'}</p>
              </div>
              <div className="rounded-xl border border-[#E5E3DC] bg-[#FCFBF8] p-3">
                <p className="text-xs text-[#7A7A6E]">Animal</p>
                <p className="text-sm font-medium text-gray-900">{selectedFarm ? 'From farm records' : 'Auto-fill after selection'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#7A7A6E]">Diagnosis</label>
                <Input
                  value={prescriptionForm.diagnosis}
                  onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="e.g. Respiratory infection"
                />
              </div>
              <div>
                <label className="text-xs text-[#7A7A6E]">Medicine</label>
                <select
                  value={selectedMedicineName}
                  onChange={(e) => setSelectedMedicineName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-[#E5E3DC] px-3 text-sm"
                >
                  <option value="">Select medicine</option>
                  {medicineChecklist.map((medicine) => (
                    <option key={medicine} value={medicine}>{medicine}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#7A7A6E]">Dose</label>
                <Input
                  value={prescriptionForm.dose}
                  onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, dose: e.target.value }))}
                  placeholder="e.g. 10 ml"
                />
              </div>
              <div>
                <label className="text-xs text-[#7A7A6E]">Duration (days)</label>
                <Input
                  type="number"
                  min={1}
                  value={prescriptionForm.duration_days}
                  onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, duration_days: Number(e.target.value || 1) }))}
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-[#7A7A6E] mb-2">Vaccines Checklist</p>
              <div className="flex flex-wrap gap-2">
                {vaccineChecklist.map((vaccine) => {
                  const checked = selectedVaccineNames.includes(vaccine);
                  return (
                    <button
                      type="button"
                      key={vaccine}
                      onClick={() =>
                        setSelectedVaccineNames((prev) =>
                          checked ? prev.filter((item) => item !== vaccine) : [...prev, vaccine]
                        )
                      }
                      className={`px-3 py-1 rounded-full border text-xs ${checked ? 'bg-[#1B5E42] text-white border-[#1B5E42]' : 'bg-white text-[#7A7A6E] border-[#E5E3DC]'}`}
                    >
                      {vaccine}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#7A7A6E]">Clinical Notes</label>
              <Input
                value={prescriptionForm.comments}
                onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, comments: e.target.value }))}
                placeholder="Optional care instructions"
              />
            </div>

            {prescriptionError && <p className="text-sm text-[#C0392B]">{prescriptionError}</p>}
            <div className="flex justify-end">
              <Button className="bg-[#1B5E42] hover:bg-[#164E36] text-white" disabled={isSavingPrescription} onClick={handleCreatePrescription}>
                {isSavingPrescription ? 'Saving...' : 'Create Prescription'}
              </Button>
            </div>
            <p className="text-xs text-[#7A7A6E]">Data is saved to backend using appointment_id linkage and persisted in prescriptions table.</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
            <CardTitle className="text-gray-900">Prescription Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-[#F7F5F0]">
                  <TableHead>Appointment</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Refills</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPrescriptions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id.slice(0, 8)}</TableCell>
                    <TableCell>{row.diagnosis}</TableCell>
                    <TableCell>{row.drug}</TableCell>
                    <TableCell>{row.dose}</TableCell>
                    <TableCell>{row.duration}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusStyle(row.status)} px-2 py-1 text-xs rounded-full`}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{row.status === 'active' ? 'In progress' : 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {recentPrescriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-[#7A7A6E] py-8">
                      No prescriptions available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFarmers = () => (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Users className="w-5 h-5 text-[#1B5E42]" />
              All Farm Owners (Users DB)
            </CardTitle>
            <div className="flex items-center gap-3">
              {farmersLastUpdatedAt && (
                <span className="text-xs text-[#7A7A6E]">Updated {new Date(farmersLastUpdatedAt).toLocaleTimeString()}</span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={loadFarmersDirectory}
                disabled={farmersLoading}
                className="border-[#E5E3DC]"
              >
                {farmersLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {farmersError && <p className="text-sm text-[#C0392B] mb-3">{farmersError}</p>}
          {farmersLoading && <p className="text-sm text-[#7A7A6E]">Loading farmers...</p>}
          {!farmersLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {farmersRiskRows.map((farmer) => (
                <div key={farmer.farmer_user_id} className="rounded-xl border border-[#E5E3DC] bg-[#FCFBF8] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{farmer.farmer_name}</p>
                      <p className="text-xs text-[#7A7A6E] mt-1">{farmer.farm_name || 'Farm not linked yet'}</p>
                    </div>
                    <Badge className={`${getSeverityStyle(farmer.riskLevel)} px-2 py-0.5 text-xs rounded-full`}>{farmer.riskLevel}</Badge>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-[#7A7A6E]">
                    <p>Email: {farmer.email || 'Not available'}</p>
                    <p>Phone: {farmer.phone_number || 'Not available'}</p>
                    <p>Risk Score: {typeof farmer.risk_score === 'number' ? farmer.risk_score : 'N/A'}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {(farmer.key_flags.length ? farmer.key_flags : ['No active risk flags']).slice(0, 3).map((flag) => (
                      <Badge key={flag} variant="outline" className="text-[10px] capitalize">
                        {flag}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">View Farm</Button>
                    <Button size="sm" variant="outline">Contact</Button>
                    <Button size="sm" onClick={() => setSelectedFarmer(farmer)}>View Risk Details</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!farmersLoading && farmersRiskRows.length === 0 && <p className="text-sm text-[#7A7A6E]">No farmer records found.</p>}
        </CardContent>
      </Card>

      {selectedFarmer && (
        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-gray-900">Risk Details: {selectedFarmer.farmer_name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFarmer(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#E5E3DC] p-4 bg-[#FCFBF8]">
              <p className="text-xs text-[#7A7A6E]">Risk Category</p>
              <p className="text-base font-semibold text-gray-900 mt-1">{selectedFarmer.risk_level || 'unknown'}</p>
            </div>
            <div className="rounded-xl border border-[#E5E3DC] p-4 bg-[#FCFBF8]">
              <p className="text-xs text-[#7A7A6E]">Risk Score</p>
              <p className="text-base font-semibold text-gray-900 mt-1">{selectedFarmer.risk_score ?? 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-[#E5E3DC] p-4 bg-[#FCFBF8]">
              <p className="text-xs text-[#7A7A6E]">Key Flags</p>
              <p className="text-sm text-gray-900 mt-1">{selectedFarmer.key_flags?.join(', ') || 'No key flags'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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

    const healthStatusDataBase = [
      { name: 'Healthy', count: healthyCount, percentage: Math.round((healthyCount / totalCases) * 1000) / 10, color: '#4CAF7D' },
      { name: 'Unhealthy', count: unhealthyCount, percentage: Math.round((unhealthyCount / totalCases) * 1000) / 10, color: '#C0392B' },
    ];
    const healthStatusData =
      cases.length > 0
        ? healthStatusDataBase
        : [
            { name: 'Healthy (Baseline)', count: 1, percentage: 50, color: '#4CAF7D' },
            { name: 'Review Pending', count: 1, percentage: 50, color: '#E8A838' },
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

    const appointmentStatusBuckets = appointments.reduce(
      (acc, item) => {
        const key = (item.status || 'scheduled').toLowerCase();
        if (key === 'completed') acc.completed += 1;
        else if (key === 'cancelled') acc.cancelled += 1;
        else if (key === 'requested') acc.requested += 1;
        else acc.scheduled += 1;
        return acc;
      },
      { requested: 0, scheduled: 0, completed: 0, cancelled: 0 }
    );

    const totalAppointments =
      appointmentStatusBuckets.requested +
      appointmentStatusBuckets.scheduled +
      appointmentStatusBuckets.completed +
      appointmentStatusBuckets.cancelled;

    const appointmentStatusData =
      totalAppointments > 0
        ? [
            { name: 'Requested', count: appointmentStatusBuckets.requested, color: '#E8A838' },
            { name: 'Scheduled', count: appointmentStatusBuckets.scheduled, color: '#1B5E42' },
            { name: 'Completed', count: appointmentStatusBuckets.completed, color: '#4CAF7D' },
            { name: 'Cancelled', count: appointmentStatusBuckets.cancelled, color: '#C0392B' },
          ]
        : [
            { name: 'Requested', count: 1, color: '#E8A838' },
            { name: 'Scheduled', count: 1, color: '#1B5E42' },
            { name: 'Completed', count: 1, color: '#4CAF7D' },
            { name: 'Cancelled', count: 1, color: '#C0392B' },
          ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
              {cases.length === 0 && (
                <p className="text-xs text-[#1B5E42] mt-3">
                  No reviewed cases yet. Baseline colors are shown until live diagnosis data starts coming in.
                </p>
              )}
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

          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader>
              <CardTitle className="text-gray-900">Appointments Status (Circular)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appointmentStatusData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={84}
                      paddingAngle={3}
                    >
                      {appointmentStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
                    <Legend verticalAlign="bottom" height={30} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="rounded-xl border border-[#E5E3DC] p-2 bg-[#F7F5F0]">
                  <p className="text-xs text-[#7A7A6E]">Requested</p>
                  <p className="text-base font-semibold text-gray-900">{appointmentStatusBuckets.requested}</p>
                </div>
                <div className="rounded-xl border border-[#E5E3DC] p-2 bg-[#F7F5F0]">
                  <p className="text-xs text-[#7A7A6E]">Scheduled</p>
                  <p className="text-base font-semibold text-gray-900">{appointmentStatusBuckets.scheduled}</p>
                </div>
              </div>
              {totalAppointments === 0 && (
                <p className="text-xs text-[#1B5E42] mt-3">
                  No appointments yet. Circular status chart stays color-coded for quick visual orientation.
                </p>
              )}
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
        return renderAlerts();
      case 'appointments':
        return renderAppointments();
      case 'cases':
        return renderCases();
      case 'vlm-review':
        return renderVlmReview();
      case 'prescriptions':
        return renderPrescriptions();
      case 'farmers':
        return renderFarmers();
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
              
              <div className="relative">
                <button className="relative text-[#7A7A6E] hover:text-gray-900 transition-colors" onClick={handleNotificationClick}>
                  <Bell className={`w-5 h-5 ${bellShake ? 'bell-shake' : ''}`} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#C0392B] text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-96 max-w-[90vw] rounded-2xl border border-[#E5E3DC] bg-white shadow-xl z-30">
                    <div className="px-4 py-3 border-b border-[#E5E3DC] flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">VLM Review Notifications</p>
                      <Badge className="bg-[#E8A838] text-white">{unreadNotifications}</Badge>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      {notificationPreview.length === 0 && (
                        <p className="px-3 py-6 text-sm text-[#7A7A6E] text-center">No pending VLM reviews right now.</p>
                      )}
                      {notificationPreview.map((item) => (
                        <button
                          key={item.detection_id}
                          onClick={() => {
                            setShowNotifications(false);
                            setActiveNav('vlm-review');
                            setVlmStatusFilter('pending_review');
                          }}
                          className="w-full text-left rounded-xl px-3 py-3 hover:bg-[#F7F5F0] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.predicted_label}</p>
                              <p className="text-xs text-[#7A7A6E] mt-1 line-clamp-1">
                                {item.farmer_name || 'Unknown Farmer'} • {item.species}
                              </p>
                              <p className="text-xs text-[#7A7A6E] mt-1">Detection #{item.detection_id}</p>
                            </div>
                            <Badge className="bg-[#E8A838] text-white text-[10px] px-2 py-0.5 rounded-full">Pending</Badge>
                          </div>
                          <p className="text-[11px] text-[#7A7A6E] mt-2">{new Date(item.created_at).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-[#E5E3DC] flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNotifications(false);
                          setActiveNav('vlm-review');
                          setVlmStatusFilter('pending_review');
                        }}
                      >
                        Open VLM Review
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <ProfileMenu
                fallbackName={userName || 'Veterinarian'}
                fallbackRole="Veterinarian"
                fallbackEmail={userEmail}
                onEditProfile={() => onNavigate('profile')}
                onLogout={onLogout}
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          {renderContent()}
        </div>
      </main>

      <Dialog open={isNotSafeDialogOpen} onOpenChange={setIsNotSafeDialogOpen}>
        <DialogContent className="sm:max-w-lg border border-[#E5E3DC] rounded-2xl bg-[#FCFBF8]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Write Message For Farmer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[#7A7A6E]">
              This message will be shown to the farmer in Detection History along with the <span className="font-medium text-[#C0392B]">Not Safe</span> verdict.
            </p>
            <textarea
              value={notSafeMessage}
              onChange={(event) => setNotSafeMessage(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-[#E5E3DC] bg-white px-3 py-2 text-sm focus:border-[#1B5E42] focus:outline-none"
              placeholder="Explain why this case is not safe and what immediate action the farmer should take."
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNotSafeDialogOpen(false);
                  setNotSafeDetectionId(null);
                  setNotSafeMessage('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#C0392B] hover:bg-[#A93226] text-white"
                onClick={submitNotSafeReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting...' : 'Mark Not Safe'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
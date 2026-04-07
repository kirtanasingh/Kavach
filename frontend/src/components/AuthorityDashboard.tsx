import { useState, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  MapPin, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Building,
  Activity,
  FileText,
  Bell,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Home,
  BarChart3,
  Globe,
  Settings,
  HelpCircle,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
  Pill,
  GitBranch,
  FileSpreadsheet,
  Clock,
  MapPinned,
  Droplet
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import logoImg from 'figma:asset/28cc7f8b67ba61bb13e03c30f73fd05e9d3d8a2c.png';

interface AuthorityDashboardProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName: string;
}

interface OutbreakData {
  id: number;
  disease: string;
  state: string;
  district: string;
  farmsAffected: number;
  severity: 'Low' | 'Medium' | 'High';
  startDate: string;
  status: 'Active' | 'Contained' | 'Monitoring';
  animalsAffected: number;
  notes: string;
}

interface FarmComplianceData {
  id: number;
  name: string;
  state: string;
  species: string;
  complianceScore: number;
  lastAudit: string;
  nonCompliantItems: string[];
  status: 'Compliant' | 'Warning' | 'Critical';
}

export function AuthorityDashboard({ onNavigate, onLogout, userName }: AuthorityDashboardProps) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [expandedOutbreak, setExpandedOutbreak] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState('all');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [bellShake, setBellShake] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Static stats — no animation
  const stats = {
    totalFarms: 2847,
    activeAlerts: 18,
    complianceRate: 87,
    criticalOutbreaks: 3
  };

  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
  };

  // Notification handler
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setBellShake(true);
      setTimeout(() => setBellShake(false), 400);
    }
  };

  // Outbreak data
  const outbreaks: OutbreakData[] = [
    { id: 1, disease: 'Newcastle Disease', state: 'Maharashtra', district: 'Pune', farmsAffected: 12, severity: 'High', startDate: '2 Apr 2026', status: 'Active', animalsAffected: 3420, notes: 'Rapid spread detected in 5km radius' },
    { id: 2, disease: 'Avian Influenza H5N1', state: 'Gujarat', district: 'Ahmedabad', farmsAffected: 8, severity: 'High', startDate: '30 Mar 2026', status: 'Contained', animalsAffected: 2150, notes: 'Containment successful, monitoring continues' },
    { id: 3, disease: 'Swine Flu', state: 'Uttar Pradesh', district: 'Lucknow', farmsAffected: 5, severity: 'Medium', startDate: '28 Mar 2026', status: 'Monitoring', animalsAffected: 870, notes: 'Isolated incident, under observation' },
    { id: 4, disease: 'Foot and Mouth Disease', state: 'Punjab', district: 'Ludhiana', farmsAffected: 3, severity: 'Low', startDate: '25 Mar 2026', status: 'Contained', animalsAffected: 420, notes: 'Successfully contained, vaccination campaign completed' },
    { id: 5, disease: 'Swine Dysentery', state: 'Karnataka', district: 'Bangalore', farmsAffected: 4, severity: 'Medium', startDate: '22 Mar 2026', status: 'Monitoring', animalsAffected: 650, notes: 'Biosecurity measures enforced' },
  ];

  // Farm compliance data
  const farmCompliance: FarmComplianceData[] = [
    { id: 1, name: 'Green Valley Poultry', state: 'Maharashtra', species: 'Poultry', complianceScore: 92, lastAudit: '1 Apr 2026', nonCompliantItems: [], status: 'Compliant' },
    { id: 2, name: 'Sunrise Pig Farm', state: 'Gujarat', species: 'Pig', complianceScore: 78, lastAudit: '28 Mar 2026', nonCompliantItems: ['Water Quality Records', 'Feed Documentation'], status: 'Warning' },
    { id: 3, name: 'Happy Hens Farm', state: 'Uttar Pradesh', species: 'Poultry', complianceScore: 65, lastAudit: '25 Mar 2026', nonCompliantItems: ['Vaccination Records', 'Biosecurity Protocol', 'AMU Logs'], status: 'Critical' },
    { id: 4, name: 'Silver Oak Farms', state: 'Punjab', species: 'Cattle', complianceScore: 88, lastAudit: '30 Mar 2026', nonCompliantItems: ['Waste Management'], status: 'Compliant' },
    { id: 5, name: 'Blue Sky Poultry', state: 'Karnataka', species: 'Poultry', complianceScore: 95, lastAudit: '2 Apr 2026', nonCompliantItems: [], status: 'Compliant' },
    { id: 6, name: 'Heritage Swine Co.', state: 'Maharashtra', species: 'Pig', complianceScore: 72, lastAudit: '27 Mar 2026', nonCompliantItems: ['Audit Trail', 'Movement Records'], status: 'Warning' },
  ];

  // Compliance by state data
  const stateCompliance: { state: string; compliance: number }[] = [
    { state: 'MH', compliance: 85 },
    { state: 'GJ', compliance: 82 },
    { state: 'UP', compliance: 78 },
    { state: 'PB', compliance: 88 },
    { state: 'KA', compliance: 86 },
    { state: 'TN', compliance: 76 },
    { state: 'HR', compliance: 79 },
    { state: 'RJ', compliance: 81 },
  ];

  // AMU time series data
  const amuTimeSeries: { month: string; totalAMU: number; withdrawalCompliance: number }[] = [
    { month: 'Oct', totalAMU: 2400, withdrawalCompliance: 89 },
    { month: 'Nov', totalAMU: 2100, withdrawalCompliance: 91 },
    { month: 'Dec', totalAMU: 2600, withdrawalCompliance: 88 },
    { month: 'Jan', totalAMU: 2300, withdrawalCompliance: 92 },
    { month: 'Feb', totalAMU: 1950, withdrawalCompliance: 94 },
    { month: 'Mar', totalAMU: 2150, withdrawalCompliance: 93 },
  ];

  // AMU species breakdown
  const amuSpeciesData: { name: string; value: number; color: string }[] = [
    { name: 'Poultry', value: 45, color: '#1B5E42' },
    { name: 'Pig', value: 32, color: '#4CAF7D' },
    { name: 'Cattle', value: 18, color: '#A8D5BA' },
    { name: 'Other', value: 5, color: '#E8F5E9' },
  ];

  // AMU drug class data
  const amuDrugClass: { class: string; usage: number }[] = [
    { class: 'Tetracyclines', usage: 850 },
    { class: 'Penicillins', usage: 650 },
    { class: 'Macrolides', usage: 420 },
    { class: 'Fluoroquinolones', usage: 320 },
    { class: 'Sulfonamides', usage: 280 },
    { class: 'Aminoglycosides', usage: 210 },
  ];

  // Contact tracing network data
  const contactNetwork = [
    { farmId: 1, farmName: "Green Valley", connections: [2, 5, 8], riskStatus: "safe", movements: 12 },
    { farmId: 2, farmName: "Sunrise Farms", connections: [1, 3, 4], riskStatus: "infected", movements: 8 },
    { farmId: 3, farmName: "Heritage Swine", connections: [2, 6], riskStatus: "at-risk", movements: 5 },
    { farmId: 4, farmName: "Dairy Fresh", connections: [2, 7], riskStatus: "at-risk", movements: 6 },
    { farmId: 5, farmName: "Mountain View", connections: [1, 9], riskStatus: "safe", movements: 4 },
  ];

  // Risk map data
  const stateRiskData = [
    { state: "Maharashtra", riskLevel: 85, farms: 425, alerts: 4, compliance: 85 },
    { state: "Uttar Pradesh", riskLevel: 62, farms: 380, alerts: 2, compliance: 78 },
    { state: "Punjab", riskLevel: 35, farms: 290, alerts: 1, compliance: 88 },
    { state: "Haryana", riskLevel: 58, farms: 245, alerts: 2, compliance: 72 },
    { state: "Tamil Nadu", riskLevel: 68, farms: 310, alerts: 3, compliance: 76 },
    { state: "Karnataka", riskLevel: 42, farms: 195, alerts: 1, compliance: 82 },
    { state: "Gujarat", riskLevel: 78, farms: 340, alerts: 3, compliance: 88 },
    { state: "Rajasthan", riskLevel: 28, farms: 215, alerts: 0, compliance: 81 },
  ];

  // Report templates
  const reportTemplates = [
    { id: 1, name: "National Biosecurity Summary", description: "Comprehensive overview of biosecurity measures across all states", lastGenerated: "2024-03-25", icon: Shield },
    { id: 2, name: "State-wise Compliance Report", description: "Detailed compliance metrics for each state with farm-level breakdown", lastGenerated: "2024-03-20", icon: CheckCircle },
    { id: 3, name: "AMU Quarterly Report", description: "Antimicrobial usage trends, compliance rates, and recommendations", lastGenerated: "2024-03-01", icon: Pill },
    { id: 4, name: "Outbreak Incident Report", description: "Documentation of all disease outbreaks with response actions taken", lastGenerated: "2024-03-18", icon: AlertTriangle },
    { id: 5, name: "Farm Audit Export", description: "Complete audit records for all registered farms in CSV format", lastGenerated: "2024-03-22", icon: FileSpreadsheet }
  ];

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel >= 70) return '#1B5E42';
    if (riskLevel >= 50) return '#4CAF7D';
    if (riskLevel >= 30) return '#A8D5BA';
    return '#E8F5E9';
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-[#C0392B] text-white';
      case 'Medium': return 'bg-[#E8A838] text-white';
      case 'Low': return 'bg-[#4CAF7D] text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-[#C0392B] text-white';
      case 'Contained': return 'bg-[#4CAF7D] text-white';
      case 'Monitoring': return 'bg-[#E8A838] text-white';
      case 'Compliant': return 'bg-[#4CAF7D] text-white';
      case 'Warning': return 'bg-[#E8A838] text-white';
      case 'Critical': return 'bg-[#C0392B] text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getRiskStatusColor = (status: string) => {
    switch (status) {
      case 'infected': return '#C0392B';
      case 'at-risk': return '#E8A838';
      case 'safe': return '#4CAF7D';
      default: return '#7A7A6E';
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'outbreaks', label: 'Outbreaks', icon: AlertTriangle },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'amu', label: 'AMU Analytics', icon: Pill },
    { id: 'tracing', label: 'Contact Tracing', icon: GitBranch },
    { id: 'riskmap', label: 'Risk Map', icon: MapPinned },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];



  // Dashboard Overview Content
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-white rounded-2xl border border-[#E5E3DC] kavach-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Total Farms Monitored</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalFarms.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#1B5E42] flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC] kavach-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Active Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeAlerts}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#E8A838] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC] kavach-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Compliance Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.complianceRate}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#1B5E42] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-[#E5E3DC] kavach-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#7A7A6E] mb-1">Critical Outbreaks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.criticalOutbreaks}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#C0392B] flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-[65%_35%] gap-6">
        {/* Left Column - 65% */}
        <div className="space-y-6">
          {/* Active Outbreaks Table */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse"></div>
                Active Outbreaks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F7F5F0]">
                    <TableHead className="text-[#7A7A6E]">Disease</TableHead>
                    <TableHead className="text-[#7A7A6E]">State</TableHead>
                    <TableHead className="text-[#7A7A6E]">Severity</TableHead>
                    <TableHead className="text-[#7A7A6E]">Affected Animals</TableHead>
                    <TableHead className="text-[#7A7A6E]">Status</TableHead>
                    <TableHead className="text-[#7A7A6E]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outbreaks.filter(o => o.status === 'Active').map((outbreak) => (
                    <TableRow key={outbreak.id} className="hover:bg-[#F7F5F0]">
                      <TableCell className="font-medium text-gray-900">{outbreak.disease}</TableCell>
                      <TableCell className="text-[#7A7A6E]">{outbreak.state}</TableCell>
                      <TableCell>
                        <Badge className={`${getSeverityStyle(outbreak.severity)} px-2 py-1 text-xs rounded-full`}>
                          {outbreak.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-900">{outbreak.animalsAffected}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusStyle(outbreak.status)} px-2 py-1 text-xs rounded-full`}>
                          {outbreak.status}
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

          {/* AMU Trends Chart */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <TrendingUp className="w-5 h-5 text-[#1B5E42]" />
                  AMU Trends
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-xs bg-[#1B5E42] text-white hover:bg-[#164E36]">
                    7D
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-[#7A7A6E] hover:bg-[#F7F5F0]">
                    1M
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-[#7A7A6E] hover:bg-[#F7F5F0]">
                    3M
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-[#7A7A6E] hover:bg-[#F7F5F0]">
                    1Y
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={amuTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7A7A6E' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#7A7A6E' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E3DC', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="totalAMU" stroke="#1B5E42" strokeWidth={2} dot={false} name="Total AMU (kg)" isAnimationActive={false} id="dashboard-line-amu" />
                  <Line type="monotone" dataKey="withdrawalCompliance" stroke="#E8A838" strokeWidth={2} dot={false} name="Withdrawal Compliance %" isAnimationActive={false} id="dashboard-line-compliance" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 35% */}
        <div className="space-y-6">
          {/* Climate & Disease Trends */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <Droplet className="w-5 h-5 text-[#1B5E42]" />
                Climate & Disease Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={amuTimeSeries}>
                  <defs>
                    <linearGradient id="colorClimateAuthority" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF7D" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4CAF7D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7A7A6E' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7A7A6E' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E3DC', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="totalAMU" stroke="#1B5E42" strokeWidth={2} fillOpacity={1} fill="url(#colorClimateAuthority)" isAnimationActive={false} id="dashboard-climate-area" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Compliance Overview */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <Shield className="w-5 h-5 text-[#1B5E42]" />
                Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {stateCompliance.slice(0, 5).map((state) => (
                  <div key={state.state} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 font-medium">{state.state}</span>
                      <span className="text-[#7A7A6E]">{state.compliance}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F7F5F0] rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div 
                          className="bg-[#1B5E42]" 
                          style={{ width: `${state.compliance}%` }}
                        ></div>
                        <div 
                          className="bg-[#C0392B]" 
                          style={{ width: `${100 - state.compliance}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Non-Compliant Farms */}
          <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
            <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                <AlertCircle className="w-5 h-5 text-[#C0392B]" />
                Top Non-Compliant Farms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {farmCompliance
                  .sort((a, b) => a.complianceScore - b.complianceScore)
                  .slice(0, 5)
                  .map((farm, index) => (
                    <div key={farm.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#7A7A6E]">#{index + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{farm.name}</p>
                            <p className="text-xs text-[#7A7A6E]">{farm.state}</p>
                          </div>
                        </div>
                        <Button variant="link" size="sm" className="text-[#1B5E42] p-0 h-auto">
                          View
                        </Button>
                      </div>
                      <div className="w-full h-1.5 bg-[#F7F5F0] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#C0392B] rounded-full" 
                          style={{ width: `${farm.complianceScore}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Outbreaks Content
  const renderOutbreaks = () => (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <AlertTriangle className="w-5 h-5 text-[#C0392B]" />
              Outbreak Management System
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-40 border-[#E5E3DC]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="maharashtra">Maharashtra</SelectItem>
                  <SelectItem value="haryana">Haryana</SelectItem>
                  <SelectItem value="tamil nadu">Tamil Nadu</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search outbreaks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 border-[#E5E3DC]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F5F0]">
                <TableHead className="text-[#7A7A6E]">Disease Name</TableHead>
                <TableHead className="text-[#7A7A6E]">State</TableHead>
                <TableHead className="text-[#7A7A6E]">District</TableHead>
                <TableHead className="text-[#7A7A6E]">Farms Affected</TableHead>
                <TableHead className="text-[#7A7A6E]">Severity</TableHead>
                <TableHead className="text-[#7A7A6E]">Start Date</TableHead>
                <TableHead className="text-[#7A7A6E]">Status</TableHead>
                <TableHead className="text-[#7A7A6E]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outbreaks.map((outbreak) => (
                <Fragment key={outbreak.id}>
                  <TableRow className="hover:bg-[#F7F5F0] cursor-pointer">
                    <TableCell className="font-medium text-gray-900">{outbreak.disease}</TableCell>
                    <TableCell className="text-[#7A7A6E]">{outbreak.state}</TableCell>
                    <TableCell className="text-[#7A7A6E]">{outbreak.district}</TableCell>
                    <TableCell className="text-gray-900">{outbreak.farmsAffected}</TableCell>
                    <TableCell>
                      <Badge className={`${getSeverityStyle(outbreak.severity)} px-2 py-1 text-xs rounded-full`}>
                        {outbreak.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#7A7A6E]">{outbreak.startDate}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusStyle(outbreak.status)} px-2 py-1 text-xs rounded-full`}>
                        {outbreak.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedOutbreak(expandedOutbreak === outbreak.id ? null : outbreak.id)}
                        className="text-[#1B5E42] hover:bg-[#F7F5F0]"
                      >
                        {expandedOutbreak === outbreak.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedOutbreak === outbreak.id && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-[#F7F5F0] p-6">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-2 space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Outbreak Details</h4>
                              <div className="bg-white rounded-lg p-4 border border-[#E5E3DC]">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-[#7A7A6E]">Animals Affected:</span>
                                    <span className="ml-2 font-medium text-gray-900">{outbreak.animalsAffected}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#7A7A6E]">Farms Affected:</span>
                                    <span className="ml-2 font-medium text-gray-900">{outbreak.farmsAffected}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                              <div className="bg-white rounded-lg p-4 border border-[#E5E3DC]">
                                <p className="text-sm text-[#7A7A6E]">{outbreak.notes}</p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <Button className="bg-[#4CAF7D] hover:bg-[#3D9B68] text-white rounded-md">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Contained
                              </Button>
                              <Button className="bg-[#C0392B] hover:bg-[#A02F23] text-white rounded-md">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Escalate Alert
                              </Button>
                              <Button variant="outline" className="border-[#E5E3DC] text-[#7A7A6E] hover:bg-white rounded-md">
                                <MapPin className="w-4 h-4 mr-2" />
                                View on Map
                              </Button>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Location Map</h4>
                            <div className="bg-white rounded-lg border border-[#E5E3DC] h-48 flex items-center justify-center">
                              <MapPin className="w-12 h-12 text-[#7A7A6E]" />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Compliance Content
  const renderCompliance = () => (
    <div className="space-y-6">
      {/* Compliance Rate by State */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-5 h-5 text-[#1B5E42]" />
            Compliance Rate by State
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stateCompliance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" />
              <XAxis dataKey="state" tick={{ fontSize: 12, fill: '#7A7A6E' }} axisLine={{ stroke: '#E5E3DC' }} />
              <YAxis tick={{ fontSize: 12, fill: '#7A7A6E' }} axisLine={{ stroke: '#E5E3DC' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E3DC', borderRadius: '8px' }} />
              <Bar dataKey="compliance" fill="#1B5E42" radius={[4, 4, 0, 0]} isAnimationActive={false} id="compliance-bar-state" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Worst Offenders */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <AlertTriangle className="w-5 h-5 text-[#C0392B]" />
            Critical Non-Compliance Farms
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {farmCompliance.filter(f => f.status === 'Critical').map((farm) => (
              <div key={farm.id} className="bg-[#C0392B]/10 border border-[#C0392B]/30 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{farm.name}</h4>
                <p className="text-sm text-[#7A7A6E] mb-1">{farm.state} • {farm.species}</p>
                <p className="text-2xl font-bold text-[#C0392B] mb-2">{farm.complianceScore}%</p>
                <div className="space-y-1">
                  {farm.nonCompliantItems.map((item, idx) => (
                    <p key={idx} className="text-xs text-[#C0392B]">• {item}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Farm List */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="w-5 h-5 text-[#1B5E42]" />
              All Registered Farms
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                <SelectTrigger className="w-40 border-[#E5E3DC]">
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="swine">Swine</SelectItem>
                  <SelectItem value="cattle">Cattle</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-md">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button className="bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-md">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F5F0]">
                <TableHead className="text-[#7A7A6E]">Farm Name</TableHead>
                <TableHead className="text-[#7A7A6E]">State</TableHead>
                <TableHead className="text-[#7A7A6E]">Species</TableHead>
                <TableHead className="text-[#7A7A6E]">Compliance Score</TableHead>
                <TableHead className="text-[#7A7A6E]">Last Audit</TableHead>
                <TableHead className="text-[#7A7A6E]">Non-Compliant Items</TableHead>
                <TableHead className="text-[#7A7A6E]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farmCompliance.map((farm) => (
                <TableRow key={farm.id} className="hover:bg-[#F7F5F0]">
                  <TableCell className="font-medium text-gray-900">{farm.name}</TableCell>
                  <TableCell className="text-[#7A7A6E]">{farm.state}</TableCell>
                  <TableCell className="text-[#7A7A6E]">{farm.species}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#F7F5F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1B5E42]"
                          style={{ width: `${farm.complianceScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">{farm.complianceScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#7A7A6E]">{farm.lastAudit}</TableCell>
                  <TableCell className="text-[#7A7A6E]">{farm.nonCompliantItems.length || 'None'}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusStyle(farm.status)} px-2 py-1 text-xs rounded-full`}>
                      {farm.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // AMU Analytics Content
  const renderAMU = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Time Series Chart */}
        <Card className="col-span-2 bg-white rounded-2xl border border-[#E5E3DC]">
          <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-5 h-5 text-[#1B5E42]" />
              Total AMU Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={amuTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7A7A6E' }} axisLine={{ stroke: '#E5E3DC' }} />
                <YAxis tick={{ fontSize: 12, fill: '#7A7A6E' }} axisLine={{ stroke: '#E5E3DC' }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E3DC', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="totalAMU" stroke="#1B5E42" strokeWidth={3} dot={{ fill: '#1B5E42', r: 4 }} name="Total AMU (kg)" isAnimationActive={false} id="amu-analytics-line-amu" />
                <Line type="monotone" dataKey="withdrawalCompliance" stroke="#E8A838" strokeWidth={3} dot={{ fill: '#E8A838', r: 4 }} name="Withdrawal Compliance %" isAnimationActive={false} id="amu-analytics-line-compliance" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Species Breakdown Donut */}
        <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
          <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Droplet className="w-5 h-5 text-[#1B5E42]" />
              Species Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={amuSpeciesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {amuSpeciesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {amuSpeciesData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-[#7A7A6E]">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drug Class Breakdown */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Pill className="w-5 h-5 text-[#1B5E42]" />
            Drug Class Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={amuDrugClass}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DC" />
              <XAxis dataKey="class" tick={{ fontSize: 12, fill: '#7A7A6E' }} axisLine={{ stroke: '#E5E3DC' }} />
              <YAxis tick={{ fontSize: 12, fill: '#7A7A6E' }} axisLine={{ stroke: '#E5E3DC' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E3DC', borderRadius: '8px' }} />
              <Bar dataKey="usage" fill="#1B5E42" radius={[4, 4, 0, 0]} isAnimationActive={false} id="amu-drug-class-bar" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights Panel */}
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <AlertCircle className="w-5 h-5 text-[#E8A838]" />
            AMU Insights & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="bg-[#C0392B]/10 border border-[#C0392B]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-[#C0392B] mb-1">⚠ Unusual Usage Spike Detected</p>
              <p className="text-sm text-[#7A7A6E]">Heritage Swine Ltd has increased AMU by 145% in the last month</p>
            </div>
            <div className="bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-[#E8A838] mb-1">⚠ Withdrawal Period Violations</p>
              <p className="text-sm text-[#7A7A6E]">3 farms flagged for inadequate withdrawal period tracking</p>
            </div>
            <div className="bg-[#4CAF7D]/10 border border-[#4CAF7D]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-[#4CAF7D] mb-1">✓ Overall Improvement</p>
              <p className="text-sm text-[#7A7A6E]">National AMU compliance improved by 8% compared to last quarter</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Contact Tracing Content
  const renderContactTracing = () => (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <GitBranch className="w-5 h-5 text-[#1B5E42]" />
            Inter-Farm Exposure Network
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-[#F7F5F0] rounded-lg h-96 flex items-center justify-center border border-[#E5E3DC]">
                <div className="text-center">
                  <GitBranch className="w-16 h-16 text-[#7A7A6E] mx-auto mb-4" />
                  <p className="text-[#7A7A6E]">Network Visualization</p>
                  <p className="text-sm text-[#7A7A6E] mt-2">Interactive node graph showing farm connections</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#C0392B]"></div>
                  <span className="text-sm text-[#7A7A6E]">Infected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#E8A838]"></div>
                  <span className="text-sm text-[#7A7A6E]">At Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#4CAF7D]"></div>
                  <span className="text-sm text-[#7A7A6E]">Safe</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Farm Movement History</h4>
              <div className="space-y-3">
                {contactNetwork.map((farm) => (
                  <div key={farm.farmId} className="bg-[#F7F5F0] rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{farm.farmName}</h5>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRiskStatusColor(farm.riskStatus) }}></div>
                    </div>
                    <p className="text-xs text-[#7A7A6E] mb-1">Connections: {farm.connections.length}</p>
                    <p className="text-xs text-[#7A7A6E]">Movements: {farm.movements} (last 30 days)</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Risk Map Content
  const renderRiskMap = () => (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <MapPinned className="w-5 h-5 text-[#1B5E42]" />
              National Disease Risk Map
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select defaultValue="state">
                <SelectTrigger className="w-40 border-[#E5E3DC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="state">State Level</SelectItem>
                  <SelectItem value="district">District Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {stateRiskData.map((state) => (
              <div
                key={state.state}
                className="kavach-card p-4 rounded-lg border border-[#E5E3DC] cursor-pointer"
                style={{ backgroundColor: getRiskColor(state.riskLevel) }}
              >
                <p className={`text-xs font-medium mb-1 ${state.riskLevel >= 50 ? 'text-white' : 'text-gray-900'}`}>
                  {state.state}
                </p>
                <p className={`text-2xl font-bold mb-2 ${state.riskLevel >= 50 ? 'text-white' : 'text-gray-900'}`}>
                  {state.riskLevel}
                </p>
                <div className={`text-xs space-y-1 ${state.riskLevel >= 50 ? 'text-white/80' : 'text-gray-600'}`}>
                  <p>{state.farms} farms</p>
                  <p>{state.alerts} active alerts</p>
                  <p>{state.compliance}% compliant</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Reports Content
  const renderReports = () => (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <FileText className="w-5 h-5 text-[#1B5E42]" />
            Report Generation Center
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {reportTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div key={template.id} className="bg-[#F7F5F0] rounded-lg p-6 border border-[#E5E3DC] hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-[#1B5E42] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-[#7A7A6E] mb-4 line-clamp-2">{template.description}</p>
                  <div className="flex items-center gap-2 text-xs text-[#7A7A6E] mb-4">
                    <Clock className="w-3 h-3" />
                    Last generated: {template.lastGenerated}
                  </div>
                  <Button className="w-full bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-md">
                    Generate Report
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
        <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Clock className="w-5 h-5 text-[#1B5E42]" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[
              { name: "National Biosecurity Summary - Q1 2024", date: "2024-03-25", size: "2.4 MB" },
              { name: "State-wise Compliance Report - March", date: "2024-03-20", size: "1.8 MB" },
              { name: "AMU Quarterly Report - Q1 2024", date: "2024-03-01", size: "3.1 MB" },
              { name: "Outbreak Incident Report - Week 12", date: "2024-03-18", size: "945 KB" }
            ].map((report, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-[#F7F5F0] rounded-lg hover:shadow-md transition-shadow">
                <div>
                  <h5 className="font-medium text-gray-900">{report.name}</h5>
                  <p className="text-sm text-[#7A7A6E]">{report.date} • {report.size}</p>
                </div>
                <Button size="sm" variant="outline" className="border-[#E5E3DC] text-[#1B5E42] hover:bg-white rounded-md">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render content based on active navigation
  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard': return renderDashboard();
      case 'outbreaks': return renderOutbreaks();
      case 'compliance': return renderCompliance();
      case 'amu': return renderAMU();
      case 'tracing': return renderContactTracing();
      case 'riskmap': return renderRiskMap();
      case 'reports': return renderReports();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E3DC] flex flex-col">
        <div className="p-6 border-b border-[#E5E3DC]">
          <img src={logoImg} alt="Kavach Logo" className="h-10" />
          <p className="text-xs text-[#7A7A6E] mt-2">National Surveillance Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm ${
                  isActive ? 'active bg-[#1B5E42] text-white' : 'text-[#7A7A6E]'
                }`}
              >
                <Icon className="nav-icon w-4 h-4" />
                <span className="nav-label">{item.label}</span>
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
            <h1 className="text-2xl font-bold text-gray-900">National Disease Surveillance</h1>
            
            <div className="flex items-center gap-6">
              <button className="text-[#7A7A6E] hover:text-gray-900 transition-colors">
                <Search className="w-5 h-5" />
              </button>
              
              <button className="relative text-[#7A7A6E] hover:text-gray-900 transition-colors" onClick={handleNotificationClick}>
                <Bell className={`w-5 h-5 ${bellShake ? 'bell-shake' : ''}`} />
                <span className="absolute -top-1 -right-1 bg-[#C0392B] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {stats.activeAlerts}
                </span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1B5E42] text-white flex items-center justify-center font-medium">
                  {userName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-[#7A7A6E]">Authority Officer</p>
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
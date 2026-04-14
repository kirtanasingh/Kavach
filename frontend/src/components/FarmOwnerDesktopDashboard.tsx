import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
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
  CheckCircle,
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
  Clock,
} from 'lucide-react';

interface FarmOwnerDesktopDashboardProps {
  onNavigate?: (view: string) => void;
}

export default function FarmOwnerDesktopDashboard({ onNavigate }: FarmOwnerDesktopDashboardProps) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [notificationCount] = useState(5);

  // Mock Data
  const stats = {
    totalAnimals: 847,
    activeAlerts: 3,
    complianceRate: 94,
    pendingTasks: 7,
  };

  const diseaseAlerts = [
    { id: 1, disease: 'Swine Flu Suspected', animal: 'Pig #A247', severity: 'Critical', affected: 1, status: 'Active' },
    { id: 2, disease: 'Foot & Mouth Disease', animal: 'Cattle #B102', severity: 'High', affected: 3, status: 'Monitoring' },
    { id: 3, disease: 'Avian Influenza', animal: 'Chicken Batch 5', severity: 'Medium', affected: 12, status: 'Active' },
    { id: 4, disease: 'PPR Suspected', animal: 'Goat #G034', severity: 'Low', affected: 1, status: 'Testing' },
  ];

  const tasks = [
    { id: 1, task: 'Complete vaccination records', worker: 'Ramesh Kumar', dueDate: '2026-04-05', status: 'Pending' },
    { id: 2, task: 'Submit monthly compliance report', worker: 'Self', dueDate: '2026-04-07', status: 'Pending' },
    { id: 3, task: 'Quarterly biosecurity audit', worker: 'Priya Sharma', dueDate: '2026-04-10', status: 'Approved' },
    { id: 4, task: 'Update animal health records', worker: 'Suresh Patil', dueDate: '2026-04-03', status: 'Done' },
    { id: 5, task: 'Equipment sanitization check', worker: 'Ramesh Kumar', dueDate: '2026-04-04', status: 'Pending' },
  ];

  const nearbyRisks = [
    { farm: 'Green Valley Farm', distance: '2.3 km', risk: 'High', color: '#C0392B' },
    { farm: 'Sunshine Poultry', distance: '4.1 km', risk: 'Medium', color: '#E8A838' },
    { farm: 'Riverside Ranch', distance: '5.8 km', risk: 'Low', color: '#4CAF7D' },
    { farm: 'Hill View Dairy', distance: '7.2 km', risk: 'Low', color: '#4CAF7D' },
  ];

  const environmentalData = {
    temperature: 28,
    humidity: 65,
    rainfall: 12,
  };

  const complianceData = {
    compliant: 12,
    nonCompliant: 1,
    total: 13,
    percentage: 92,
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-[#C0392B] text-white';
      case 'high':
        return 'bg-[#E8A838] text-white';
      case 'medium':
        return 'bg-[#E8A838]/70 text-white';
      case 'low':
        return 'bg-[#4CAF7D] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-[#C0392B] text-white';
      case 'monitoring':
        return 'bg-[#E8A838] text-white';
      case 'testing':
        return 'bg-[#7A7A6E] text-white';
      case 'pending':
        return 'bg-[#E8A838] text-white';
      case 'done':
        return 'bg-[#4CAF7D] text-white';
      case 'approved':
        return 'bg-[#1B5E42] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleNavClick = (navId: string) => {
    if (navId === 'detection') {
      navigate('/dashboard/vlm');
      return;
    }
    setActiveNav(navId);
    if (onNavigate) {
      onNavigate(navId);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'detection', label: 'Disease Detection', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex">
      {/* Fixed Left Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E3DC] flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-[#E5E3DC]">
          <h1 className="text-2xl font-bold text-[#1B5E42]">Kavach</h1>
          <p className="text-xs text-[#7A7A6E] mt-1">Farm Biosecurity Portal</p>
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-all ${
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
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-[#7A7A6E] hover:bg-[#F7F5F0] transition-all">
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
                  <p className="text-sm font-medium text-gray-900">Rajesh Patel</p>
                  <p className="text-xs text-[#7A7A6E]">Farm Owner</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-6">
          {/* Metric Cards Row */}
          <div className="grid grid-cols-4 gap-6">
            <Card className="bg-white rounded-2xl border border-[#E5E3DC]" style={{ boxShadow: '0 2px 12px rgba(27, 94, 66, 0.08)' }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#7A7A6E] mb-1">Total Animals</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalAnimals.toLocaleString()}</p>
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
                    <p className="text-3xl font-bold text-gray-900">{stats.activeAlerts}</p>
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
                    <p className="text-3xl font-bold text-gray-900">{stats.complianceRate}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#1B5E42]/10 flex items-center justify-center">
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
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingTasks}</p>
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
            {/* Left Column - 65% */}
            <div className="space-y-6">
              {/* Disease Detection Card */}
              <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
                <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Activity className="w-5 h-5 text-[#1B5E42]" />
                    Disease Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="border-2 border-dashed border-[#4CAF7D]/50 bg-[#F7F5F0] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#1B5E42]/10 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-[#1B5E42]" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Upload Image/Video</p>
                    <p className="text-xs text-[#7A7A6E]">Click to upload or drag and drop animal photos or videos</p>
                  </div>
                  <Button onClick={() => navigate('/dashboard/vlm')} className="w-full bg-[#1B5E42] hover:bg-[#164E36] text-white rounded-lg py-3">
                    Start Detection
                  </Button>
                </CardContent>
              </Card>

              {/* Active Disease Alerts Table */}
              <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
                <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <AlertCircle className="w-5 h-5 text-[#C0392B]" />
                    Active Disease Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F7F5F0]">
                        <TableHead className="text-[#7A7A6E]">Disease</TableHead>
                        <TableHead className="text-[#7A7A6E]">Animal</TableHead>
                        <TableHead className="text-[#7A7A6E]">Severity</TableHead>
                        <TableHead className="text-[#7A7A6E]">Affected Count</TableHead>
                        <TableHead className="text-[#7A7A6E]">Status</TableHead>
                        <TableHead className="text-[#7A7A6E]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diseaseAlerts.map((alert) => (
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

              {/* Task Management Card */}
              <Card className="bg-white rounded-2xl border border-[#E5E3DC]">
                <CardHeader className="border-b border-[#E5E3DC] px-6 py-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <ClipboardList className="w-5 h-5 text-[#1B5E42]" />
                    Task Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 bg-[#F7F5F0] rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">{task.task}</p>
                          <div className="flex items-center gap-4 text-xs text-[#7A7A6E]">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {task.worker}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.dueDate}
                            </span>
                          </div>
                        </div>
                        <Badge className={`${getStatusStyle(task.status)} px-3 py-1 text-xs rounded-full`}>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - 35% */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
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
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: farm.color }}
                        ></div>
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
                        <div 
                          className="bg-[#1B5E42]" 
                          style={{ width: `${(complianceData.compliant / complianceData.total) * 100}%` }}
                        ></div>
                        <div 
                          className="bg-[#C0392B]" 
                          style={{ width: `${(complianceData.nonCompliant / complianceData.total) * 100}%` }}
                        ></div>
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
        </div>
      </main>
    </div>
  );
}

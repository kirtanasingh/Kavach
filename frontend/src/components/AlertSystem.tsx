import { useState, useEffect, useMemo } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Bell, X, AlertCircle, Clock, CheckCircle, AlertTriangle, 
  Pill, Calendar, Target, Shield, Filter, Search, Eye,
  ChevronDown, ExternalLink, MoreVertical, Archive, Trash2
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { fetchAlerts, normalizeAlert } from "../services/alertService";

interface Alert {
  id: string;
  type: 'compliance' | 'withdrawal' | 'medicine' | 'task' | 'approval' | 'system';
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    animalId?: string;
    medicineId?: string;
    farmId?: string;
    taskId?: string;
    region?: string;
    daysRemaining?: number;
  };
}

interface AlertSystemProps {
  userRole: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority';
  userName: string;
}

// Mock alert data generator based on user role
const generateMockAlerts = (userRole: string): Alert[] => {
  const baseAlerts: Alert[] = [];
  const now = new Date();

  // Farm Owner specific alerts
  if (userRole === 'Farm Owner') {
    baseAlerts.push(
      {
        id: 'fw-001',
        type: 'withdrawal',
        severity: 'urgent',
        title: '⚠️ Milk collected before withdrawal ended!',
        message: 'Cow #A112 still had 2 days left on Amoxicillin withdrawal period',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 mins ago
        isRead: false,
        metadata: { animalId: 'A112', daysRemaining: 2, medicineId: 'Amoxicillin' }
      },
      {
        id: 'fw-002',
        type: 'withdrawal',
        severity: 'warning',
        title: '🔔 Withdrawal period ending soon',
        message: 'Pig #P045 withdrawal period ends tomorrow (Oxytetracycline)',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        metadata: { animalId: 'P045', daysRemaining: 1, medicineId: 'Oxytetracycline' }
      },
      {
        id: 'fw-003',
        type: 'compliance',
        severity: 'urgent',
        title: '⚠️ Repeated AMU on same animal',
        message: 'Cow #C089 has received 3rd antibiotic treatment this month',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        isRead: false,
        metadata: { animalId: 'C089' }
      },
      {
        id: 'fw-004',
        type: 'medicine',
        severity: 'warning',
        title: '📅 Medicine expiring soon',
        message: 'Penicillin G batch #PG2024 expires in 5 days',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        isRead: true,
        metadata: { medicineId: 'Penicillin G' }
      },
      {
        id: 'fw-005',
        type: 'task',
        severity: 'info',
        title: '✅ Task completed by worker',
        message: 'Building A cleaning task has been completed by Farm Worker',
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
        isRead: true,
        metadata: { taskId: '1' }
      }
    );
  }

  // Farm Worker specific alerts
  if (userRole === 'Farm Worker') {
    baseAlerts.push(
      {
        id: 'fw-w001',
        type: 'task',
        severity: 'urgent',
        title: '🚨 High priority task assigned',
        message: 'Health check required for sick cow in Building B - Due today',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
        isRead: false,
        metadata: { taskId: '5' }
      },
      {
        id: 'fw-w002',
        type: 'withdrawal',
        severity: 'warning',
        title: '⏱️ Withdrawal period reminder',
        message: 'Do not milk Cow #A112 - 2 days remaining on withdrawal',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        isRead: false,
        metadata: { animalId: 'A112', daysRemaining: 2 }
      },
      {
        id: 'fw-w003',
        type: 'approval',
        severity: 'info',
        title: '✅ Task approved by owner',
        message: 'Your vaccination work in Building C has been approved',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        isRead: true,
        metadata: { taskId: '3' }
      },
      {
        id: 'fw-w004',
        type: 'system',
        severity: 'info',
        title: '📚 New training module available',
        message: 'Biosecurity protocols training module has been updated',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
        isRead: true
      }
    );
  }

  // Veterinarian specific alerts
  if (userRole === 'Veterinarian') {
    baseAlerts.push(
      {
        id: 'vet-001',
        type: 'compliance',
        severity: 'urgent',
        title: '🚨 Multiple violations detected',
        message: 'Green Valley Farm has 3 withdrawal violations this week',
        timestamp: new Date(now.getTime() - 20 * 60 * 1000), // 20 mins ago
        isRead: false,
        metadata: { farmId: 'Green Valley Farm' }
      },
      {
        id: 'vet-002',
        type: 'approval',
        severity: 'warning',
        title: '📋 Treatment approval needed',
        message: 'Emergency Enrofloxacin treatment requested for Sunny Acres Farm',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 mins ago
        isRead: false,
        metadata: { farmId: 'Sunny Acres Farm', medicineId: 'Enrofloxacin' }
      },
      {
        id: 'vet-003',
        type: 'compliance',
        severity: 'warning',
        title: '📊 Unusual AMU pattern',
        message: 'Hillside Ranch showing 40% increase in antibiotic usage',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        metadata: { farmId: 'Hillside Ranch' }
      },
      {
        id: 'vet-004',
        type: 'medicine',
        severity: 'info',
        title: '💊 New AMU entry logged',
        message: 'Amoxicillin treatment logged for Farm ID: F2024-089',
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
        isRead: true,
        metadata: { farmId: 'F2024-089', medicineId: 'Amoxicillin' }
      }
    );
  }

  // Authority specific alerts
  if (userRole === 'Authority') {
    baseAlerts.push(
      {
        id: 'auth-001',
        type: 'compliance',
        severity: 'urgent',
        title: '🚨 Regional compliance dropped',
        message: 'West region compliance fell to 85% - immediate action required',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000), // 10 mins ago
        isRead: false,
        metadata: { region: 'West' }
      },
      {
        id: 'auth-002',
        type: 'system',
        severity: 'warning',
        title: '📈 Trend alert: AMU spike detected',
        message: 'Oxytetracycline usage increased 25% across all regions this month',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        isRead: false,
        metadata: { medicineId: 'Oxytetracycline' }
      },
      {
        id: 'auth-003',
        type: 'compliance',
        severity: 'urgent',
        title: '⚠️ Recurring violation pattern',
        message: '8 farms in West region repeatedly violating withdrawal periods',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        isRead: false,
        metadata: { region: 'West' }
      },
      {
        id: 'auth-004',
        type: 'system',
        severity: 'info',
        title: '📊 Weekly compliance report ready',
        message: 'Regional compliance summary for Week 51 is now available',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        isRead: true
      }
    );
  }

  return baseAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export function AlertSystem({ userRole, userName }: AlertSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  // Initialize alerts from backend or fallback to mock data
  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetchAlerts(token)
      .then(data => {
        const normalizedAlerts = data.map(raw => ({
          ...normalizeAlert(raw),
          timestamp: new Date(raw.created_at)
        }));
        setAlerts(normalizedAlerts);
      })
      .catch(() => {
        // Fallback to mock data during development
        setAlerts(generateMockAlerts(userRole));
      });
  }, [userRole]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return alerts.filter(alert => !alert.isRead).length;
  }, [alerts]);

  // Filter alerts based on search and filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           alert.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || alert.type === selectedType;
      const matchesSeverity = selectedSeverity === "all" || alert.severity === selectedSeverity;
      
      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [alerts, searchQuery, selectedType, selectedSeverity]);

  // Group alerts by read status
  const unreadAlerts = filteredAlerts.filter(alert => !alert.isRead);
  const readAlerts = filteredAlerts.filter(alert => alert.isRead);

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  };

  const deleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'info': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'compliance': return <Shield className="w-4 h-4" />;
      case 'withdrawal': return <Clock className="w-4 h-4" />;
      case 'medicine': return <Pill className="w-4 h-4" />;
      case 'task': return <Target className="w-4 h-4" />;
      case 'approval': return <CheckCircle className="w-4 h-4" />;
      case 'system': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const AlertCard = ({ alert }: { alert: Alert }) => (
    <Card className={`mb-3 transition-all hover:shadow-md ${!alert.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              {getTypeIcon(alert.type)}
              {getSeverityIcon(alert.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold text-sm text-gray-900 flex-1">{alert.title}</h4>
                <Badge variant={getSeverityColor(alert.severity)} className="text-xs px-2 py-0 flex-shrink-0">
                  {alert.severity}
                </Badge>
                {!alert.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">{alert.message}</p>
              
              {/* Metadata display */}
              {alert.metadata && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {alert.metadata.animalId && (
                    <Badge variant="outline" className="text-xs bg-white">
                      🐄 {alert.metadata.animalId}
                    </Badge>
                  )}
                  {alert.metadata.medicineId && (
                    <Badge variant="outline" className="text-xs bg-white">
                      💊 {alert.metadata.medicineId}
                    </Badge>
                  )}
                  {alert.metadata.farmId && (
                    <Badge variant="outline" className="text-xs bg-white">
                      🏡 {alert.metadata.farmId}
                    </Badge>
                  )}
                  {alert.metadata.region && (
                    <Badge variant="outline" className="text-xs bg-white">
                      📍 {alert.metadata.region}
                    </Badge>
                  )}
                  {alert.metadata.daysRemaining && (
                    <Badge variant="outline" className="text-xs bg-white">
                      ⏱️ {alert.metadata.daysRemaining} days
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-500 font-medium">{formatTimestamp(alert.timestamp)}</span>
                <div className="flex items-center gap-1">
                  {!alert.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(alert.id)}
                      className="text-xs h-7 px-2 hover:bg-blue-100"
                    >
                      Mark as read
                    </Button>
                  )}
                  {alert.actionUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!alert.isRead && (
                        <DropdownMenuItem onClick={() => markAsRead(alert.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Mark as read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteAlert(alert.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="relative">
      {/* Alert Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </Button>

      {/* Alert Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border rounded-lg shadow-xl z-50 max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="medicine">Medicine</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="approval">Approval</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Alerts Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="unread" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
                <TabsTrigger value="unread" className="text-sm">
                  Unread ({unreadAlerts.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-sm">
                  All ({filteredAlerts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="unread" className="flex-1 mt-2 overflow-hidden">
                <ScrollArea className="h-[450px] px-4 pb-4">
                  {unreadAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p className="text-sm">No unread notifications</p>
                    </div>
                  ) : (
                    unreadAlerts.map(alert => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="all" className="flex-1 mt-2 overflow-hidden">
                <ScrollArea className="h-[450px] px-4 pb-4">
                  {filteredAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No notifications found</p>
                    </div>
                  ) : (
                    <>
                      {unreadAlerts.length > 0 && (
                        <>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Unread</h4>
                          {unreadAlerts.map(alert => (
                            <AlertCard key={alert.id} alert={alert} />
                          ))}
                        </>
                      )}
                      
                      {readAlerts.length > 0 && (
                        <>
                          {unreadAlerts.length > 0 && <Separator className="my-4" />}
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Read</h4>
                          {readAlerts.map(alert => (
                            <AlertCard key={alert.id} alert={alert} />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
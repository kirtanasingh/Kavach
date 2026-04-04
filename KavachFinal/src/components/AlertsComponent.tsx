import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  Clock,
  Shield,
  Thermometer,
  Activity,
  Users
} from "lucide-react";

interface Alert {
  id: number;
  title: string;
  timestamp: string;
  status: 'critical' | 'warning' | 'info';
  icon: 'alert' | 'info' | 'shield' | 'temperature' | 'activity' | 'users';
}

interface AlertsComponentProps {
  userRole: 'Farm Owner' | 'Farm Worker' | 'Veterinarian';
}

export function AlertsComponent({ userRole }: AlertsComponentProps) {
  // Role-specific alerts
  const getAlertsForRole = (role: string): Alert[] => {
    const baseAlerts: Alert[] = [
      {
        id: 1,
        title: "Temperature spike in Building A",
        timestamp: "5 min ago",
        status: "critical",
        icon: "temperature"
      },
      {
        id: 2,
        title: "Water system pressure low",
        timestamp: "12 min ago",
        status: "warning",
        icon: "alert"
      },
      {
        id: 3,
        title: "Daily health check completed",
        timestamp: "1 hour ago",
        status: "info",
        icon: "activity"
      }
    ];

    switch (role) {
      case 'Farm Owner':
        return [
          ...baseAlerts,
          {
            id: 4,
            title: "New disease alert: 15km radius",
            timestamp: "2 hours ago",
            status: "critical",
            icon: "shield"
          },
          {
            id: 5,
            title: "Monthly biosecurity report due",
            timestamp: "3 hours ago",
            status: "warning",
            icon: "info"
          }
        ];
      
      case 'Farm Worker':
        return [
          ...baseAlerts,
          {
            id: 4,
            title: "Feed inventory running low",
            timestamp: "30 min ago",
            status: "warning",
            icon: "alert"
          },
          {
            id: 5,
            title: "Task approved by farm owner",
            timestamp: "1.5 hours ago",
            status: "info",
            icon: "info"
          }
        ];
      
      case 'Veterinarian':
        return [
          {
            id: 1,
            title: "Emergency call from Green Farm",
            timestamp: "3 min ago",
            status: "critical",
            icon: "alert"
          },
          {
            id: 2,
            title: "Vaccination schedule reminder",
            timestamp: "20 min ago",
            status: "warning",
            icon: "activity"
          },
          {
            id: 3,
            title: "Health report submitted",
            timestamp: "45 min ago",
            status: "info",
            icon: "info"
          },
          {
            id: 4,
            title: "New farm registered in area",
            timestamp: "2 hours ago",
            status: "info",
            icon: "users"
          }
        ];
      
      default:
        return baseAlerts;
    }
  };

  const [alerts] = useState<Alert[]>(getAlertsForRole(userRole));
  const [unreadCount] = useState(3); // Number of unread alerts

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-orange-500 text-white';
      case 'info':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getIcon = (icon: Alert['icon']) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (icon) {
      case 'alert':
        return <AlertTriangle {...iconProps} />;
      case 'info':
        return <Info {...iconProps} />;
      case 'shield':
        return <Shield {...iconProps} />;
      case 'temperature':
        return <Thermometer {...iconProps} />;
      case 'activity':
        return <Activity {...iconProps} />;
      case 'users':
        return <Users {...iconProps} />;
      default:
        return <AlertCircle {...iconProps} />;
    }
  };

  return (
    <Card className="w-full bg-white shadow-lg rounded-2xl border border-gray-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Alerts & Notifications
          </CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white rounded-full px-2 py-1 text-xs min-w-[20px] h-5 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-l-4 border-l-primary/20"
              >
                <div className={`p-2 rounded-full ${getStatusColor(alert.status)} flex-shrink-0`}>
                  {getIcon(alert.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">
                      {alert.title}
                    </p>
                    <Badge className={`text-xs px-2 py-1 ${getStatusColor(alert.status)} rounded-full`}>
                      {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {alert.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        ID: {alert.id.toString().padStart(3, '0')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {alert.status === 'critical' && 'Immediate attention required'}
                    {alert.status === 'warning' && 'Action recommended'}
                    {alert.status === 'info' && 'For your information'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
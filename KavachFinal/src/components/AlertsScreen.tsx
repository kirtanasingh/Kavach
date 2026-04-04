import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { ArrowLeft, AlertTriangle, Info, CheckCircle, Bell, MessageCircle, Smartphone } from "lucide-react";

interface AlertsScreenProps {
  onNavigate: (screen: string) => void;
}

const alerts = [
  {
    id: 1,
    type: "outbreak",
    title: "Disease Outbreak Alert",
    message: "Avian flu reported in poultry farms 15km from your location",
    time: "2 hours ago",
    severity: "high",
    read: false
  },
  {
    id: 2,
    type: "info",
    title: "Weather Advisory",
    message: "Heavy rains expected this week. Ensure proper drainage around animal housing.",
    time: "1 day ago",
    severity: "medium",
    read: false
  },
  {
    id: 3,
    type: "reminder",
    title: "Vaccination Reminder",
    message: "Quarterly vaccination due for your poultry flock next week.",
    time: "2 days ago",
    severity: "low",
    read: true
  },
  {
    id: 4,
    type: "outbreak",
    title: "All Clear Update",
    message: "African Swine Fever outbreak in Region 3 has been contained.",
    time: "3 days ago",
    severity: "low",
    read: true
  },
  {
    id: 5,
    type: "info",
    title: "Training Available",
    message: "New biosecurity training module now available in your dashboard.",
    time: "1 week ago",
    severity: "low",
    read: true
  }
];

export function AlertsScreen({ onNavigate }: AlertsScreenProps) {
  const getAlertIcon = (type: string, severity: string) => {
    if (type === "outbreak" && severity === "high") {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    } else if (type === "outbreak") {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else {
      return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertColor = (severity: string, read: boolean) => {
    if (!read) {
      if (severity === "high") return "border-red-200 bg-red-50";
      if (severity === "medium") return "border-orange-200 bg-orange-50";
    }
    return "border-gray-200 bg-white";
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === "high") return <Badge className="bg-red-100 text-red-700">Urgent</Badge>;
    if (severity === "medium") return <Badge className="bg-orange-100 text-orange-700">Important</Badge>;
    return <Badge variant="secondary">Info</Badge>;
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white px-4 py-6 border-b">
        <div className="flex items-center space-x-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Alerts & Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-700">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="p-4">
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-600">Receive alerts on your device</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">SMS Alerts</p>
                    <p className="text-sm text-gray-600">Critical alerts via text message</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">In-App Notifications</p>
                    <p className="text-sm text-gray-600">Show notifications within the app</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Alerts</h2>
            <Button variant="ghost" size="sm">
              Mark all as read
            </Button>
          </div>

          {alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`${getAlertColor(alert.severity, alert.read)} transition-all hover:shadow-md`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type, alert.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`font-medium ${!alert.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {alert.title}
                      </h3>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    
                    <p className={`text-sm mb-2 ${!alert.read ? 'text-gray-700' : 'text-gray-600'}`}>
                      {alert.message}
                    </p>
                    
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                  
                  {!alert.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Emergency Contact */}
        <Card className="mt-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900">Emergency Contact</h3>
                <p className="text-sm text-red-700">For urgent disease outbreaks, call the veterinary hotline</p>
              </div>
            </div>
            <Button className="w-full mt-3 bg-red-600 hover:bg-red-700">
              Call Emergency Hotline
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
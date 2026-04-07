import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { ArrowLeft, User, MapPin, Phone, Mail, Settings, HelpCircle, FileText, LogOut } from "lucide-react";

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white px-4 py-6 border-b">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile & Settings</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Profile Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">John Farmer</h2>
                <p className="text-gray-600">Poultry & Pig Farm Owner</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="John Farmer" className="mt-1" />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+63 912 345 6789" className="mt-1" />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" defaultValue="john.farmer@example.com" className="mt-1" />
                </div>
                
                <div>
                  <Label htmlFor="location">Farm Location</Label>
                  <Input id="location" defaultValue="Laguna, Philippines" className="mt-1" />
                </div>
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-700">
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Farm Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Farm Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="farm-type">Farm Type</Label>
                <Input id="farm-type" defaultValue="Mixed Farm" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="animal-count">Total Animals</Label>
                <Input id="animal-count" defaultValue="250" className="mt-1" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="farm-size">Farm Size (hectares)</Label>
              <Input id="farm-size" defaultValue="3.5" className="mt-1" />
            </div>

            <Button variant="outline" className="w-full">
              Update Farm Details
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-gray-600">Switch to dark theme</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Automatic Backups</p>
                <p className="text-sm text-gray-600">Backup your data regularly</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Location Services</p>
                <p className="text-sm text-gray-600">Allow location-based alerts</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <HelpCircle className="w-5 h-5 mr-3" />
            Help & Support
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <FileText className="w-5 h-5 mr-3" />
            Privacy Policy
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <Settings className="w-5 h-5 mr-3" />
            App Settings
          </Button>
          
          <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>

        {/* App Version */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Kavach v1.2.0</p>
          <p>© 2025 Kavach - Farm Biosecurity Platform</p>
        </div>
      </div>
    </div>
  );
}
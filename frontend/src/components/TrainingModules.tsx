import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { ArrowLeft, Play, CheckCircle, Lock, BookOpen } from "lucide-react";

interface TrainingModulesProps {
  onNavigate: (screen: string) => void;
}

const modules = [
  {
    id: 1,
    title: "Introduction to Biosecurity",
    description: "Learn the fundamentals of farm biosecurity and why it's crucial for animal health.",
    duration: "15 min",
    progress: 100,
    status: "completed",
    lessons: 4
  },
  {
    id: 2,
    title: "Visitor Management",
    description: "Best practices for managing visitors and preventing disease transmission.",
    duration: "20 min",
    progress: 100,
    status: "completed",
    lessons: 5
  },
  {
    id: 3,
    title: "Cleaning & Disinfection",
    description: "Step-by-step guide to effective cleaning and disinfection protocols.",
    duration: "25 min",
    progress: 75,
    status: "in-progress",
    lessons: 6
  },
  {
    id: 4,
    title: "Feed & Water Safety",
    description: "Ensuring your animals' feed and water sources are safe and contamination-free.",
    duration: "18 min",
    progress: 0,
    status: "locked",
    lessons: 4
  },
  {
    id: 5,
    title: "Disease Recognition",
    description: "Early signs of common diseases and when to contact a veterinarian.",
    duration: "30 min",
    progress: 0,
    status: "locked",
    lessons: 7
  },
  {
    id: 6,
    title: "Emergency Response",
    description: "What to do when you suspect a disease outbreak on your farm.",
    duration: "22 min",
    progress: 0,
    status: "locked",
    lessons: 5
  }
];

export function TrainingModules({ onNavigate }: TrainingModulesProps) {
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  if (selectedModule) {
    const module = modules.find(m => m.id === selectedModule);
    if (!module) return null;

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white px-4 py-6 border-b">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedModule(null)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">{module.title}</h1>
          </div>
        </div>

        <div className="p-4">
          {/* Module Progress */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Module Progress</span>
                <span className="text-sm font-medium">{module.progress}%</span>
              </div>
              <Progress value={module.progress} className="mb-4" />
              <p className="text-sm text-gray-600">{module.lessons} lessons • {module.duration}</p>
            </CardContent>
          </Card>

          {/* Lessons List */}
          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: module.lessons }, (_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    {i < Math.floor((module.progress / 100) * module.lessons) ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : i === Math.floor((module.progress / 100) * module.lessons) ? (
                      <Play className="w-4 h-4 text-blue-600" />
                    ) : (
                      <span className="text-sm text-gray-400">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Lesson {i + 1}</p>
                    <p className="text-sm text-gray-600">3-4 min read</p>
                  </div>
                  {i < Math.floor((module.progress / 100) * module.lessons) && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="mt-6">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              {module.progress === 100 ? 'Review Module' : 'Continue Learning'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold">Training Modules</h1>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="p-4">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
                <p className="text-sm text-gray-600">3 of 6 modules completed</p>
                <Progress value={50} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((module) => (
            <Card 
              key={module.id} 
              className={`cursor-pointer transition-all ${
                module.status === 'locked' ? 'opacity-60' : 'hover:shadow-md'
              }`}
              onClick={() => module.status !== 'locked' && setSelectedModule(module.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {module.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : module.status === 'in-progress' ? (
                      <Play className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Lock className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{module.title}</h3>
                      {module.status === 'completed' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Completed
                        </Badge>
                      )}
                      {module.status === 'in-progress' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{module.lessons} lessons</span>
                        <span>{module.duration}</span>
                      </div>
                      
                      {module.status !== 'locked' && module.progress > 0 && (
                        <div className="flex items-center space-x-2">
                          <Progress value={module.progress} className="w-20" />
                          <span className="text-sm text-gray-600">{module.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { AboutUs } from "./components/AboutUs";
import { ServicesPage } from "./components/ServicesPage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { MarketingHomepage } from "./components/MarketingHomepage";
import FarmOwnerDashboard from "./components/FarmOwnerDashboard";
import FarmOwnerDesktopDashboard from "./components/FarmOwnerDesktopDashboard";
import { FarmWorkerDashboard } from "./components/FarmWorkerDashboard";
import { VetDashboard } from "./components/VetDashboard";
import { AuthorityDashboard } from "./components/AuthorityDashboard";
import { FarmDetailsPage } from "./components/FarmDetailsPage";
import { RiskAssessmentPage } from "./components/RiskAssessmentPage";
import { AMULoggingPage } from "./components/AMULoggingPage";
import { WithdrawalTrackerPage } from "./components/WithdrawalTrackerPage";
import { ComplianceDashboard } from "./components/ComplianceDashboard";
import { TrendAnalytics } from "./components/TrendAnalytics";
import { DiseaseDetectionPage } from "./components/DiseaseDetectionPage";

// Shared task interface
interface Task {
  id: number;
  description: string;
  worker: string;
  status: 'pending' | 'worker_done' | 'approved';
  dueDate: string;
  reference: string;
  priority: 'high' | 'medium' | 'low';
  assignedBy?: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('marketing');
  const [user, setUser] = useState<{
    name: string;
    role: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority';
    email?: string;
  } | null>(null);

  // Shared tasks state - using generic worker names that match common login names
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      description: "Clean cattle shed in Building A",
      worker: "Farm Worker", // Generic name that will match any worker login
      status: "pending",
      dueDate: "Today",
      reference: "https://youtube.com/watch?v=cleaning-guide",
      priority: "high",
      assignedBy: "Farm Owner"
    },
    {
      id: 2,
      description: "Check water system in pig pens",
      worker: "Farm Worker",
      status: "worker_done",
      dueDate: "Today",
      reference: "https://docs.farm.com/water-systems",
      priority: "medium",
      assignedBy: "Farm Owner"
    },
    {
      id: 3,
      description: "Vaccinate poultry in Building C",
      worker: "Farm Worker",
      status: "approved",
      dueDate: "Yesterday",
      reference: "https://youtube.com/watch?v=vaccination-guide",
      priority: "high",
      assignedBy: "Farm Owner"
    },
    {
      id: 4,
      description: "Feed distribution - morning round",
      worker: "Farm Worker",
      status: "worker_done",
      dueDate: "Today",
      reference: "https://docs.farm.com/feeding-schedule",
      priority: "medium",
      assignedBy: "Farm Owner"
    },
    {
      id: 5,
      description: "Health check on sick cow in Building B",
      worker: "Farm Worker",
      status: "pending",
      dueDate: "Today",
      reference: "https://youtube.com/watch?v=health-check-guide",
      priority: "high",
      assignedBy: "Farm Owner"
    }
  ]);

  const handleLogin = (userData: { name: string; role: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority'; email?: string }) => {
    setUser(userData);
    // Navigate to appropriate dashboard based on role
    switch (userData.role) {
      case 'Farm Owner':
        setCurrentScreen('farm-owner-dashboard');
        break;
      case 'Farm Worker':
        setCurrentScreen('farm-worker-dashboard');
        break;
      case 'Veterinarian':
        setCurrentScreen('vet-dashboard');
        break;
      case 'Authority':
        setCurrentScreen('authority-dashboard');
        break;
    }
  };

  const handleRegister = (userData: { name: string; role: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority'; email?: string }) => {
    setUser(userData);
    // For farm owners, navigate to farm details collection
    if (userData.role === 'Farm Owner') {
      setCurrentScreen('farm-details');
    } else {
      // For other roles, go directly to dashboard
      switch (userData.role) {
        case 'Farm Worker':
          setCurrentScreen('farm-worker-dashboard');
          break;
        case 'Veterinarian':
          setCurrentScreen('vet-dashboard');
          break;
        case 'Authority':
          setCurrentScreen('authority-dashboard');
          break;
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  // Task management functions
  const handleTaskUpdate = (taskId: number, newStatus: 'pending' | 'worker_done' | 'approved') => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const addNewTask = (newTask: Omit<Task, 'id'>) => {
    const nextId = Math.max(...tasks.map(t => t.id)) + 1;
    setTasks(prevTasks => [...prevTasks, { ...newTask, id: nextId }]);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'marketing':
        return <MarketingHomepage onNavigate={setCurrentScreen} />;
      case 'home':
        return <LandingPage onNavigate={setCurrentScreen} />;
      case 'about':
        return <AboutUs onNavigate={setCurrentScreen} />;
      case 'services':
        return <ServicesPage onNavigate={setCurrentScreen} />;
      case 'login':
        return <LoginPage onNavigate={setCurrentScreen} onLogin={handleLogin} />;
      case 'register':
        return <RegisterPage onNavigate={setCurrentScreen} onRegister={handleRegister} />;
      case 'farm-details':
        return user && user.email ? (
          <FarmDetailsPage 
            onNavigate={setCurrentScreen} 
            userEmail={user.email}
            userName={user.name}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'risk-assessment':
        return user && user.email ? (
          <RiskAssessmentPage 
            onNavigate={setCurrentScreen}
            onComplete={handleLogin}
            userEmail={user.email}
            userName={user.name}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'farm-owner-dashboard':
        return user ? (
          <FarmOwnerDashboard 
            onNavigate={setCurrentScreen} 
            onLogout={handleLogout}
            userName={user.name}
            userEmail={user.email}
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onAddTask={addNewTask}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'farm-worker-dashboard':
        return user ? (
          <FarmWorkerDashboard 
            onNavigate={setCurrentScreen} 
            onLogout={handleLogout}
            userName={user.name}
            workerName={user.name}
            userRole={user.role}
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'vet-dashboard':
        return user ? (
          <VetDashboard 
            onNavigate={setCurrentScreen} 
            onLogout={handleLogout}
            userName={user.name}
            userEmail={user.email}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'authority-dashboard':
        return user ? (
          <AuthorityDashboard 
            onNavigate={setCurrentScreen} 
            onLogout={handleLogout}
            userName={user.name}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'farm-owner-desktop':
        return <FarmOwnerDesktopDashboard onNavigate={setCurrentScreen} />;
      case 'amu-logging':
        return user && user.role === 'Veterinarian' ? (
          <AMULoggingPage 
            onNavigate={setCurrentScreen}
            userName={user.name}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'withdrawal-tracker':
        return user && user.role === 'Farm Owner' ? (
          <WithdrawalTrackerPage 
            onNavigate={setCurrentScreen}
            userName={user.name}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'compliance-dashboard':
        return user ? (
          <ComplianceDashboard 
            onNavigate={setCurrentScreen}
            userName={user.name}
            userRole={user.role}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'trend-analytics':
        return user && (user.role === 'Authority' || user.role === 'Veterinarian') ? (
          <TrendAnalytics 
            onNavigate={setCurrentScreen}
            userName={user.name}
            userRole={user.role}
          />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      case 'disease-detection':
        return user && user.role === 'Farm Owner' ? (
          <DiseaseDetectionPage onNavigate={setCurrentScreen} />
        ) : <LandingPage onNavigate={setCurrentScreen} />;
      default:
        return <LandingPage onNavigate={setCurrentScreen} />;
    }
  };

  // Hide header for login, register pages, onboarding flow, and dashboards
  const showHeader = !['marketing', 'login', 'register', 'farm-details', 'risk-assessment', 'farm-owner-dashboard', 'farm-owner-desktop', 'farm-worker-dashboard', 'vet-dashboard', 'authority-dashboard', 'amu-logging', 'withdrawal-tracker', 'compliance-dashboard', 'trend-analytics', 'disease-detection'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <Header currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
      {renderScreen()}
    </div>
  );
}
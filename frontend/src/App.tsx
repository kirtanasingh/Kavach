import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
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

const SCREEN_TO_PATH: Record<string, string> = {
  marketing: '/marketing',
  home: '/home',
  about: '/about',
  services: '/services',
  login: '/login',
  register: '/register',
  'farm-details': '/onboarding/farm-details',
  'risk-assessment': '/onboarding/risk-assessment',
  'farm-owner-dashboard': '/dashboard',
  'farm-worker-dashboard': '/dashboard/worker',
  'vet-dashboard': '/dashboard/vet',
  'authority-dashboard': '/dashboard/authority',
  'farm-owner-desktop': '/dashboard/farm-owner-desktop',
  'amu-logging': '/dashboard/amu-logging',
  'withdrawal-tracker': '/dashboard/withdrawal-tracker',
  'compliance-dashboard': '/dashboard/compliance',
  'trend-analytics': '/dashboard/trend-analytics',
  'disease-detection': '/dashboard/vlm',
};

function getScreenFromPath(pathname: string): string {
  const routeToScreen: Array<[string, string]> = [
    ['/marketing', 'marketing'],
    ['/home', 'home'],
    ['/about', 'about'],
    ['/services', 'services'],
    ['/login', 'login'],
    ['/register', 'register'],
    ['/onboarding/farm-details', 'farm-details'],
    ['/onboarding/risk-assessment', 'risk-assessment'],
    ['/dashboard/worker', 'farm-worker-dashboard'],
    ['/dashboard/vet', 'vet-dashboard'],
    ['/dashboard/authority', 'authority-dashboard'],
    ['/dashboard/farm-owner-desktop', 'farm-owner-desktop'],
    ['/dashboard/amu-logging', 'amu-logging'],
    ['/dashboard/withdrawal-tracker', 'withdrawal-tracker'],
    ['/dashboard/compliance', 'compliance-dashboard'],
    ['/dashboard/trend-analytics', 'trend-analytics'],
    ['/dashboard/vlm', 'disease-detection'],
    ['/dashboard', 'farm-owner-dashboard'],
  ];

  const match = routeToScreen.find(([route]) => pathname === route);
  return match?.[1] ?? 'home';
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const navigateByScreen = (screen: string) => {
    navigate(SCREEN_TO_PATH[screen] ?? '/home');
  };

  const currentScreen = useMemo(() => getScreenFromPath(location.pathname), [location.pathname]);

  const handleLogin = (userData: { name: string; role: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority'; email?: string }) => {
    setUser(userData);
    switch (userData.role) {
      case 'Farm Owner':
        navigate('/dashboard');
        break;
      case 'Farm Worker':
        navigate('/dashboard/worker');
        break;
      case 'Veterinarian':
        navigate('/dashboard/vet');
        break;
      case 'Authority':
        navigate('/dashboard/authority');
        break;
    }
  };

  const handleRegister = (userData: { name: string; role: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority'; email?: string }) => {
    setUser(userData);
    if (userData.role === 'Farm Owner') {
      navigate('/onboarding/farm-details');
    } else {
      switch (userData.role) {
        case 'Farm Worker':
          navigate('/dashboard/worker');
          break;
        case 'Veterinarian':
          navigate('/dashboard/vet');
          break;
        case 'Authority':
          navigate('/dashboard/authority');
          break;
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
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

  const showHeader = ![
    'marketing',
    'login',
    'register',
    'farm-details',
    'risk-assessment',
    'farm-owner-dashboard',
    'farm-owner-desktop',
    'farm-worker-dashboard',
    'vet-dashboard',
    'authority-dashboard',
    'amu-logging',
    'withdrawal-tracker',
    'compliance-dashboard',
    'trend-analytics',
    'disease-detection',
  ].includes(currentScreen);

  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <Header currentScreen={currentScreen} onNavigate={navigateByScreen} />
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/marketing" replace />} />
        <Route path="/marketing" element={<MarketingHomepage onNavigate={navigateByScreen} />} />
        <Route path="/home" element={<LandingPage onNavigate={navigateByScreen} />} />
        <Route path="/about" element={<AboutUs onNavigate={navigateByScreen} />} />
        <Route path="/services" element={<ServicesPage onNavigate={navigateByScreen} />} />
        <Route path="/login" element={<LoginPage onNavigate={navigateByScreen} onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage onNavigate={navigateByScreen} onRegister={handleRegister} />} />

        <Route
          path="/onboarding/farm-details"
          element={
            user && user.email ? (
              <FarmDetailsPage onNavigate={navigateByScreen} userEmail={user.email} userName={user.name} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/onboarding/risk-assessment"
          element={
            user && user.email ? (
              <RiskAssessmentPage
                onNavigate={navigateByScreen}
                onComplete={handleLogin}
                userEmail={user.email}
                userName={user.name}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            user ? (
              <FarmOwnerDashboard
                initialNav="home"
                onNavigate={navigateByScreen}
                onLogout={handleLogout}
                userName={user.name}
                userEmail={user.email}
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
                onAddTask={addNewTask}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard/worker"
          element={
            user ? (
              <FarmWorkerDashboard
                onNavigate={navigateByScreen}
                onLogout={handleLogout}
                userName={user.name}
                workerName={user.name}
                userRole={user.role}
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard/vet"
          element={
            user ? (
              <VetDashboard
                onNavigate={navigateByScreen}
                onLogout={handleLogout}
                userName={user.name}
                userEmail={user.email}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard/authority"
          element={
            user ? (
              <AuthorityDashboard onNavigate={navigateByScreen} onLogout={handleLogout} userName={user.name} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/dashboard/farm-owner-desktop" element={<FarmOwnerDesktopDashboard onNavigate={navigateByScreen} />} />

        <Route
          path="/dashboard/amu-logging"
          element={
            user && user.role === 'Veterinarian' ? (
              <AMULoggingPage onNavigate={navigateByScreen} userName={user.name} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/dashboard/withdrawal-tracker"
          element={
            user && user.role === 'Farm Owner' ? (
              <WithdrawalTrackerPage onNavigate={navigateByScreen} userName={user.name} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/dashboard/compliance"
          element={
            user ? (
              <ComplianceDashboard onNavigate={navigateByScreen} userName={user.name} userRole={user.role} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard/trend-analytics"
          element={
            user && (user.role === 'Authority' || user.role === 'Veterinarian') ? (
              <TrendAnalytics onNavigate={navigateByScreen} userName={user.name} userRole={user.role} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/dashboard/vlm"
          element={
            user ? (
              <FarmOwnerDashboard
                initialNav="detection"
                onNavigate={navigateByScreen}
                onLogout={handleLogout}
                userName={user.name}
                userEmail={user.email}
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
                onAddTask={addNewTask}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/marketing" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
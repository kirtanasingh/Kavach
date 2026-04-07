import { useState } from "react";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { AboutUs } from "./components/AboutUs";
import { ServicesPage } from "./components/ServicesPage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { FarmOwnerDashboard } from "./components/FarmOwnerDashboard";
import { FarmWorkerDashboard } from "./components/FarmWorkerDashboard";
import { VetDashboard } from "./components/VetDashboard";
import { AuthorityDashboard } from "./components/AuthorityDashboard";
import { FarmDetailsPage } from "./components/FarmDetailsPage";
import { RiskAssessmentPage } from "./components/RiskAssessmentPage";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [user, setUser] = useState(null);

  // Shared tasks state - using generic worker names that match common login names
  const [tasks, setTasks] = useState([
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

  const handleLogin = (userData) => {
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

  const handleRegister = (userData) => {
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
    setCurrentScreen('home');
  };

  // Task management functions
  const handleTaskUpdate = (taskId, newStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const addNewTask = (newTask) => {
    const nextId = Math.max(...tasks.map(t => t.id)) + 1;
    setTasks(prevTasks => [...prevTasks, { ...newTask, id: nextId }]);
  };

  const renderScreen = () => {
    switch (currentScreen) {
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
      default:
        return <LandingPage onNavigate={setCurrentScreen} />;
    }
  };

  // Hide header for login, register pages, onboarding flow, and dashboards
  const showHeader = !['login', 'register', 'farm-details', 'risk-assessment', 'farm-owner-dashboard', 'farm-worker-dashboard', 'vet-dashboard', 'authority-dashboard'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <Header currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
      {renderScreen()}
    </div>
  );
}
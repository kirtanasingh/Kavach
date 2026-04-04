// Mock database service using localStorage for user management
// This simulates a real database without requiring backend infrastructure

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  role: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority';
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  password: string; // In real app, this would be hashed
  createdAt: string;
  farmDetails?: FarmDetails;
  riskAssessment?: RiskAssessment;
}

export interface FarmDetails {
  farmName: string;
  farmType: string;
  farmSize: string;
  sizeUnit: string;
  establishedYear: string;
  totalAnimals: string;
  animalTypes: string[];
  farmingMethods: string[];
  certifications: string[];
  primaryProducts: string;
  annualRevenue?: string;
  farmDescription?: string;
  createdAt: string;
}

export interface RiskAssessment {
  answers: { [key: string]: boolean };
  score: number;
  completedAt: string;
}

export interface TreatmentLog {
  id: string;
  animalId: string;
  drugName: string;
  dosage: string;
  reason: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  vetComment?: string;
  farmerEmail: string;
  vetEmail?: string;
  animalType: 'pig' | 'poultry' | 'cattle';
  withdrawalPeriod?: string;
  lastEdited?: string;
  createdAt: string;
}

export interface VetFarmerAssignment {
  id: string;
  farmerEmail: string;
  vetEmail: string;
  assignedDate: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  farmerEmail: string;
  vetEmail: string;
  sender: 'farmer' | 'vet';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    name: string;
    role: 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority';
    email?: string;
  };
  error?: string;
}

class MockDatabase {
  private readonly USERS_KEY = 'kavach_users';
  private readonly DEMO_USERS_KEY = 'kavach_demo_initialized';
  private readonly TREATMENT_LOGS_KEY = 'kavach_treatment_logs';
  private readonly VET_ASSIGNMENTS_KEY = 'kavach_vet_assignments';
  private readonly CHAT_MESSAGES_KEY = 'kavach_chat_messages';

  constructor() {
    this.initializeDemoUsers();
    this.initializeDemoCollaborationData();
  }

  // Initialize demo users for testing
  private initializeDemoUsers(): void {
    if (localStorage.getItem(this.DEMO_USERS_KEY)) {
      return; // Demo users already initialized
    }

    const demoUsers: User[] = [
      {
        id: 'demo-owner-1',
        fullName: 'Rajesh Kumar',
        email: 'owner@kavach.com',
        phoneNumber: '+91 9876543210',
        dateOfBirth: '1985-03-15',
        role: 'Farm Owner',
        streetAddress: '123 Farm Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'india',
        password: 'owner123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-worker-1',
        fullName: 'John Smith',
        email: 'worker@kavach.com',
        phoneNumber: '+91 9876543211',
        dateOfBirth: '1990-07-22',
        role: 'Farm Worker',
        streetAddress: '456 Worker Street',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
        country: 'india',
        password: 'worker123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-vet-1',
        fullName: 'Dr. Sarah Johnson',
        email: 'vet@kavach.com',
        phoneNumber: '+91 9876543212',
        dateOfBirth: '1982-12-10',
        role: 'Veterinarian',
        streetAddress: '789 Clinic Avenue',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'india',
        password: 'vet123',
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-authority-1',
        fullName: 'Officer Arjun Mehta',
        email: 'authority@kavach.com',
        phoneNumber: '+91 9876543213',
        dateOfBirth: '1980-05-20',
        role: 'Authority',
        streetAddress: '101 Government Complex',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'india',
        password: 'auth123',
        createdAt: new Date().toISOString()
      }
    ];

    // Store demo users
    localStorage.setItem(this.USERS_KEY, JSON.stringify(demoUsers));
    localStorage.setItem(this.DEMO_USERS_KEY, 'true');
  }

  // Get all users from localStorage
  private getUsers(): User[] {
    const usersJson = localStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  // Save users to localStorage
  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // Generate unique ID for new users
  private generateId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Map role values from form to system format
  private mapRoleFromForm(formRole: string): 'Farm Owner' | 'Farm Worker' | 'Veterinarian' | 'Authority' {
    switch (formRole) {
      case 'farm-owner':
        return 'Farm Owner';
      case 'farm-worker':
        return 'Farm Worker';
      case 'vet':
        return 'Veterinarian';
      case 'authority':
        return 'Authority';
      default:
        return 'Farm Owner';
    }
  }

  // Register a new user
  public registerUser(userData: Omit<User, 'id' | 'createdAt' | 'role'> & { role: string }): AuthResult {
    const users = this.getUsers();
    
    // Check if email already exists
    const existingUser = users.find(user => 
      user.email.toLowerCase() === userData.email.toLowerCase()
    );
    
    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists'
      };
    }

    // Create new user
    const newUser: User = {
      ...userData,
      id: this.generateId(),
      role: this.mapRoleFromForm(userData.role),
      createdAt: new Date().toISOString()
    };

    // Add to users array and save
    users.push(newUser);
    this.saveUsers(users);

    return {
      success: true,
      user: {
        name: newUser.fullName,
        role: newUser.role,
        email: newUser.email
      }
    };
  }

  // Authenticate user login
  public authenticateUser(credentials: LoginCredentials): AuthResult {
    const users = this.getUsers();
    const { emailOrUsername, password } = credentials;
    
    // Find user by email or try legacy demo keywords
    let user = users.find(user => 
      user.email.toLowerCase() === emailOrUsername.toLowerCase()
    );

    // Legacy support for demo keywords (for backward compatibility)
    if (!user) {
      const input = emailOrUsername.toLowerCase();
      if (input.includes('owner') || input === 'owner') {
        user = users.find(u => u.role === 'Farm Owner');
        // For legacy demo, accept any password
        if (user) {
          return {
            success: true,
            user: {
              name: user.fullName,
              role: user.role,
              email: user.email
            }
          };
        }
      } else if (input.includes('worker') || input === 'worker') {
        user = users.find(u => u.role === 'Farm Worker');
        // For legacy demo, accept any password
        if (user) {
          return {
            success: true,
            user: {
              name: user.fullName,
              role: user.role,
              email: user.email
            }
          };
        }
      } else if (input.includes('vet') || input === 'vet') {
        user = users.find(u => u.role === 'Veterinarian');
        // For legacy demo, accept any password
        if (user) {
          return {
            success: true,
            user: {
              name: user.fullName,
              role: user.role,
              email: user.email
            }
          };
        }
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'User not found. Please check your email/username.'
      };
    }

    // Check password (in real app, this would be hashed comparison)
    if (user.password !== password) {
      return {
        success: false,
        error: 'Invalid password. Please try again.'
      };
    }

    return {
      success: true,
      user: {
        name: user.fullName,
        role: user.role,
        email: user.email
      }
    };
  }

  // Get user by email (for future features)
  public getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // Get all users (for admin features - future use)
  public getAllUsers(): User[] {
    return this.getUsers();
  }

  // Save farm details for a user
  public saveFarmDetails(email: string, farmDetails: Omit<FarmDetails, 'createdAt'>): AuthResult {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Add farm details to user
    users[userIndex].farmDetails = {
      ...farmDetails,
      createdAt: new Date().toISOString()
    };

    this.saveUsers(users);

    return {
      success: true,
      user: {
        name: users[userIndex].fullName,
        role: users[userIndex].role,
        email: users[userIndex].email
      }
    };
  }

  // Save risk assessment for a user
  public saveRiskAssessment(email: string, riskAssessment: RiskAssessment): AuthResult {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Add risk assessment to user
    users[userIndex].riskAssessment = riskAssessment;

    this.saveUsers(users);

    return {
      success: true,
      user: {
        name: users[userIndex].fullName,
        role: users[userIndex].role,
        email: users[userIndex].email
      }
    };
  }

  // Get user's risk score (for dashboard display)
  public getUserRiskScore(email: string): number | null {
    const user = this.getUserByEmail(email);
    return user?.riskAssessment?.score || null;
  }

  // Delete all users (for testing purposes)
  public clearAllUsers(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.DEMO_USERS_KEY);
    this.initializeDemoUsers(); // Re-initialize demo users
  }

  // Initialize demo collaboration data
  private initializeDemoCollaborationData(): void {
    if (localStorage.getItem('kavach_collab_demo_initialized')) {
      return;
    }

    // Demo vet-farmer assignments
    const demoAssignments: VetFarmerAssignment[] = [
      {
        id: 'assign_1',
        farmerEmail: 'owner@kavach.com',
        vetEmail: 'vet@kavach.com',
        assignedDate: new Date().toISOString(),
        isActive: true
      }
    ];

    // Demo treatment logs
    const demoTreatmentLogs: TreatmentLog[] = [
      {
        id: 'log_1',
        animalId: 'PIG-001',
        drugName: 'Amoxicillin',
        dosage: '15ml twice daily',
        reason: 'Respiratory infection symptoms',
        submissionDate: '2024-01-15',
        status: 'pending',
        farmerEmail: 'owner@kavach.com',
        vetEmail: 'vet@kavach.com',
        animalType: 'pig',
        withdrawalPeriod: '28 days',
        createdAt: new Date().toISOString()
      },
      {
        id: 'log_2',
        animalId: 'POULTRY-025',
        drugName: 'Tylosin',
        dosage: '2mg per bird',
        reason: 'Chronic respiratory disease prevention',
        submissionDate: '2024-01-14',
        status: 'approved',
        farmerEmail: 'owner@kavach.com',
        vetEmail: 'vet@kavach.com',
        animalType: 'poultry',
        withdrawalPeriod: '5 days',
        vetComment: 'Approved. Continue for 7 days.',
        createdAt: new Date().toISOString()
      }
    ];

    // Demo chat messages
    const demoChatMessages: ChatMessage[] = [
      {
        id: 'msg_1',
        farmerEmail: 'owner@kavach.com',
        vetEmail: 'vet@kavach.com',
        sender: 'farmer',
        message: 'Dr. Patel, I noticed some pigs showing respiratory symptoms. Should I start treatment?',
        timestamp: '10:30 AM',
        read: true
      },
      {
        id: 'msg_2',
        farmerEmail: 'owner@kavach.com',
        vetEmail: 'vet@kavach.com',
        sender: 'vet',
        message: 'Can you describe the symptoms in detail? Any fever, coughing, loss of appetite?',
        timestamp: '10:45 AM',
        read: true
      }
    ];

    localStorage.setItem(this.VET_ASSIGNMENTS_KEY, JSON.stringify(demoAssignments));
    localStorage.setItem(this.TREATMENT_LOGS_KEY, JSON.stringify(demoTreatmentLogs));
    localStorage.setItem(this.CHAT_MESSAGES_KEY, JSON.stringify(demoChatMessages));
    localStorage.setItem('kavach_collab_demo_initialized', 'true');
  }

  // Treatment Log Management
  public getTreatmentLogs(): TreatmentLog[] {
    const logsJson = localStorage.getItem(this.TREATMENT_LOGS_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  }

  private saveTreatmentLogs(logs: TreatmentLog[]): void {
    localStorage.setItem(this.TREATMENT_LOGS_KEY, JSON.stringify(logs));
  }

  public submitTreatmentLog(logData: Omit<TreatmentLog, 'id' | 'createdAt' | 'status'>): { success: boolean; id?: string; error?: string } {
    const logs = this.getTreatmentLogs();
    const newLog: TreatmentLog = {
      ...logData,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    logs.push(newLog);
    this.saveTreatmentLogs(logs);

    return { success: true, id: newLog.id };
  }

  public updateTreatmentLogStatus(logId: string, status: 'approved' | 'edited' | 'rejected', vetComment?: string, newDosage?: string): { success: boolean; error?: string } {
    const logs = this.getTreatmentLogs();
    const logIndex = logs.findIndex(log => log.id === logId);

    if (logIndex === -1) {
      return { success: false, error: 'Treatment log not found' };
    }

    logs[logIndex].status = status;
    if (vetComment) {
      logs[logIndex].vetComment = vetComment;
    }
    if (newDosage) {
      logs[logIndex].dosage = newDosage;
    }
    logs[logIndex].lastEdited = new Date().toISOString();

    this.saveTreatmentLogs(logs);
    return { success: true };
  }

  public getTreatmentLogsByFarmer(farmerEmail: string): TreatmentLog[] {
    const logs = this.getTreatmentLogs();
    return logs.filter(log => log.farmerEmail.toLowerCase() === farmerEmail.toLowerCase());
  }

  public getTreatmentLogsByVet(vetEmail: string): TreatmentLog[] {
    const logs = this.getTreatmentLogs();
    return logs.filter(log => log.vetEmail?.toLowerCase() === vetEmail.toLowerCase());
  }

  public getPendingTreatmentLogsForVet(vetEmail: string): TreatmentLog[] {
    const logs = this.getTreatmentLogsByVet(vetEmail);
    return logs.filter(log => log.status === 'pending');
  }

  // Vet-Farmer Assignment Management
  public getVetAssignments(): VetFarmerAssignment[] {
    const assignmentsJson = localStorage.getItem(this.VET_ASSIGNMENTS_KEY);
    return assignmentsJson ? JSON.parse(assignmentsJson) : [];
  }

  public getAssignedVetForFarmer(farmerEmail: string): User | null {
    const assignments = this.getVetAssignments();
    const activeAssignment = assignments.find(
      assignment => assignment.farmerEmail.toLowerCase() === farmerEmail.toLowerCase() && assignment.isActive
    );

    if (!activeAssignment) return null;

    return this.getUserByEmail(activeAssignment.vetEmail);
  }

  public getAssignedFarmersForVet(vetEmail: string): User[] {
    const assignments = this.getVetAssignments();
    const activeAssignments = assignments.filter(
      assignment => assignment.vetEmail.toLowerCase() === vetEmail.toLowerCase() && assignment.isActive
    );

    return activeAssignments
      .map(assignment => this.getUserByEmail(assignment.farmerEmail))
      .filter(user => user !== null) as User[];
  }

  // Chat Message Management
  public getChatMessages(): ChatMessage[] {
    const messagesJson = localStorage.getItem(this.CHAT_MESSAGES_KEY);
    return messagesJson ? JSON.parse(messagesJson) : [];
  }

  private saveChatMessages(messages: ChatMessage[]): void {
    localStorage.setItem(this.CHAT_MESSAGES_KEY, JSON.stringify(messages));
  }

  public getChatMessagesBetween(farmerEmail: string, vetEmail: string): ChatMessage[] {
    const messages = this.getChatMessages();
    return messages.filter(msg => 
      (msg.farmerEmail.toLowerCase() === farmerEmail.toLowerCase() && 
       msg.vetEmail.toLowerCase() === vetEmail.toLowerCase())
    );
  }

  public sendChatMessage(farmerEmail: string, vetEmail: string, sender: 'farmer' | 'vet', message: string): { success: boolean; id?: string; error?: string } {
    const messages = this.getChatMessages();
    const newMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      farmerEmail,
      vetEmail,
      sender,
      message,
      timestamp: new Date().toLocaleTimeString(),
      read: false
    };

    messages.push(newMessage);
    this.saveChatMessages(messages);

    return { success: true, id: newMessage.id };
  }
}

// Export singleton instance
export const mockDB = new MockDatabase();
// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

// Factor interface for appraisal
export interface Factor {
  id: string;
  name: string;
  weight: number;
}

// Comparable property interface
export interface ComparableProperty {
  id: string;
  description: string;
  area: number;
  value: number;
  factors: { factorId: string; value: number }[];
}

// Target property interface
export interface TargetProperty {
  description: string;
  area: number;
  factors: { factorId: string; value: number }[];
}

// Appraisal calculation interface
export interface AppraisalCalculation {
  id: string;
  userId: string;
  createdAt: string;
  targetProperty: TargetProperty;
  comparables: ComparableProperty[];
  factors: Factor[];
  result: {
    estimatedValue: number;
    valuePerSqm: number;
    usedComparables: string[];
    excludedComparables: string[];
  };
}

// Auth state interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, phone: string, password: string) => boolean;
  logout: () => void;
}

// App state interface
export interface AppState {
  calculations: AppraisalCalculation[];
  addCalculation: (calculation: Omit<AppraisalCalculation, 'id' | 'userId' | 'createdAt'>) => void;
  getUserCalculations: (userId: string) => AppraisalCalculation[];
}

import { create } from 'zustand';
import { AppraisalCalculation } from '../types';

interface CalculationStore {
  calculations: AppraisalCalculation[];
  addCalculation: (calculation: Omit<AppraisalCalculation, 'id' | 'createdAt'>) => void;
  getUserCalculations: (userId: string) => AppraisalCalculation[];
  getCalculationById: (id: string) => AppraisalCalculation | undefined;
}

const STORAGE_KEY = 'appraisal_calculations';
const MAX_CALCULATIONS = 3;

const getStoredCalculations = (): AppraisalCalculation[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const useCalculationStore = create<CalculationStore>((set, get) => ({
  calculations: getStoredCalculations(),

  addCalculation: (calculation) => {
    const state = get();
    const userCalculations = state.getUserCalculations(calculation.userId);
    
    const newCalculation: AppraisalCalculation = {
      ...calculation,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    // Keep only last MAX_CALCULATIONS per user
    const otherUserCalculations = state.calculations.filter(
      c => c.userId !== calculation.userId
    );

    const updatedUserCalculations = [newCalculation, ...userCalculations].slice(0, MAX_CALCULATIONS);
    const allCalculations = [...otherUserCalculations, ...updatedUserCalculations];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCalculations));
    set({ calculations: allCalculations });
  },

  getUserCalculations: (userId) => {
    return get().calculations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getCalculationById: (id) => {
    return get().calculations.find(c => c.id === id);
  },
}));

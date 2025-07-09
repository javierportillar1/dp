export interface Employee {
  id: string;
  name: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  eps: string;
  contractType: 'OPS' | 'NOMINA';
  cedula: string;
  salary: number;
  workedDays: number;
  createdDate?: string;
}

export interface Novelty {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'ABSENCE' | 'LATE' | 'EARLY_LEAVE' | 'MEDICAL_LEAVE' | 'VACATION' | 'BONUS' | 'GAS_ALLOWANCE' | 'OVERTIME';
  date: string;
  description: string;
  discountDays: number; // For deductions
  bonusAmount: number; // For bonuses
}

export interface PayrollCalculation {
  employee: Employee;
  workedDays: number;
  totalDaysInMonth: number;
  baseSalary: number;
  discountedDays: number;
  transportAllowance: number;
  grossSalary: number;
  bonuses: number;
  deductions: {
    health: number;
    pension: number;
    solidarity: number;
    advance: number;
    total: number;
  };
  netSalary: number;
  novelties: Novelty[];
}

export interface DeductionRates {
  health: number;
  pension: number;
  solidarity: number;
  transportAllowance: number;
}

export interface AdvancePayment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: string;
  month: string;
  description: string;
}

export const MINIMUM_SALARY_COLOMBIA = 1300000; // 2024 value
export const TRANSPORT_ALLOWANCE = 162000; // 2024 value

export const DEFAULT_DEDUCTION_RATES: DeductionRates = {
  health: 4,
  pension: 4,
  solidarity: 1,
  transportAllowance: TRANSPORT_ALLOWANCE,
};

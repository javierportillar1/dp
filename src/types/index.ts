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
  type: 'ABSENCE' | 'LATE' | 'EARLY_LEAVE' | 'MEDICAL_LEAVE' | 'VACATION' | 'FIXED_COMPENSATION' | 'SALES_BONUS' | 'FIXED_OVERTIME' | 'UNEXPECTED_OVERTIME' | 'NIGHT_SURCHARGE' | 'SUNDAY_WORK' | 'GAS_ALLOWANCE';
  date: string;
  description: string;
  discountDays: number; // For deductions
  bonusAmount: number; // For bonuses
  hours?: number; // For hour-based calculations
  days?: number; // For day-based calculations
  unitType: 'DAYS' | 'MONEY' | 'HOURS'; // To specify what unit is being used
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
  bonusCalculations: {
    fixedCompensation: number;
    salesBonus: number;
    fixedOvertime: number;
    unexpectedOvertime: number;
    nightSurcharge: number;
    sundayWork: number;
    gasAllowance: number;
    total: number;
  };
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
  sunday1: number; // Dominical 1
  sunday2: number; // Dominical 2  
  sunday3: number; // Dominical 3
  overtime: number; // Horas extra
  nightSellers: number; // Nocturnos vendedores
  nightSurcharge: number; // Recargos nocturnos
  ordinaryHour: number; // Hora ordinaria
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
  sunday1: 37200,
  sunday2: 25500,
  sunday3: 23200,
  overtime: 7800,
  nightSellers: 32800,
  nightSurcharge: 2200,
  ordinaryHour: 6200,
};

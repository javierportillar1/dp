import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { EmployeeManagement } from './components/EmployeeManagement';
import { NoveltyManagement } from './components/NoveltyManagement';
import { AdvanceManagement } from './components/AdvanceManagement';
import { PayrollCalculator } from './components/PayrollCalculator';
import { PayrollPreview } from './components/PayrollPreview';
import { SettingsManagement } from './components/SettingsManagement';
import {
  Employee,
  Novelty,
  PayrollCalculation,
  AdvancePayment,
  DeductionRates,
  DEFAULT_DEDUCTION_RATES,
} from './types';

/* ---------------------------------------------------------------------------
   Reusable localStorage hook – colócalo en otro archivo si prefieres
--------------------------------------------------------------------------- */
function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsedValue = JSON.parse(stored);
        // If defaultValue is an array, ensure we return an array
        if (Array.isArray(defaultValue)) {
          return Array.isArray(parsedValue) ? parsedValue : defaultValue;
        }
        // For objects, merge with defaultValue to ensure all properties exist
        if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
          return { ...(defaultValue as Record<string, unknown>), ...(parsedValue as Record<string, unknown>) } as T;
        }
        // For primitive values, return parsed value directly
        return parsedValue;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Failed to save ${key} to localStorage`, err);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/* ---------------------------------------------------------------------------
   App component
--------------------------------------------------------------------------- */
function App() {
  const [activeSection, setActiveSection] = useState<'employees' | 'novelties' | 'advances' | 'calculator' | 'preview' | 'settings'>('employees');

  // Persisted state
  const [employees, setEmployees]               = useLocalStorage<Employee[]>          ('employees',         []);
  const [novelties, setNovelties]               = useLocalStorage<Novelty[]>           ('novelties',         []);
  const [advances, setAdvances]                 = useLocalStorage<AdvancePayment[]>    ('advances',          []);
  const [payrollCalculations, setPayroll]       = useLocalStorage<PayrollCalculation[]>('payrollCalculations', []);
  const [deductionRates, setDeductionRates]     = useLocalStorage<DeductionRates>      ('deductionRates',    DEFAULT_DEDUCTION_RATES);

  // Migration function to add isPensioned field to existing employees
  React.useEffect(() => {
    setEmployees(prev => 
      prev.map(emp => ({
        ...emp,
        isPensioned: emp.isPensioned ?? false
      }))
    );
  }, [setEmployees]);
  /* -----------------------------------------------------------------------
     Actualiza workedDays cada hora (UTC-5) sin sobrescribir en caliente
  ----------------------------------------------------------------------- */
  const updateWorkedDays = useCallback(() => {
    setEmployees(prev =>
      prev.map(emp => {
        if (!emp.createdDate) return emp;

        const created     = new Date(emp.createdDate);
        const now         = new Date();
        const utcMinus5Ms = 5 * 60 * 60 * 1000;

        const diffDays = Math.ceil(
          (now.getTime() - created.getTime() - utcMinus5Ms) / (1000 * 60 * 60 * 24)
        );

        const workedDays = Math.max(1, diffDays);
        return workedDays !== emp.workedDays ? { ...emp, workedDays } : emp;
      })
    );
  }, [setEmployees]);

  // Auto-apply recurring licenses for new months
  React.useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Find all recurring licenses
    const recurringLicenses = novelties.filter(n => 
      n.isRecurring && 
      n.startMonth && 
      n.startMonth <= currentMonth
    );
    
    // Check if we need to add licenses for current month
    const newLicenses: Novelty[] = [];
    
    recurringLicenses.forEach(license => {
      const existsForCurrentMonth = novelties.some(n => 
        n.employeeId === license.employeeId &&
        n.type === license.type &&
        n.date.startsWith(currentMonth)
      );
      
      if (!existsForCurrentMonth) {
        newLicenses.push({
          ...license,
          id: crypto.randomUUID(),
          date: `${currentMonth}-01`,
          description: `${license.description} (Auto-aplicada desde ${license.startMonth})`
        });
      }
    });
    
    if (newLicenses.length > 0) {
      setNovelties(prev => [...prev, ...newLicenses]);
    }
  }, [novelties, setNovelties]);
  useEffect(() => {
    updateWorkedDays();                    // primera vez
    const id = setInterval(updateWorkedDays, 60 * 60 * 1000); // cada hora
    return () => clearInterval(id);
  }, [updateWorkedDays]);

  /* -----------------------------------------------------------------------
     Render dinámico según sección
  ----------------------------------------------------------------------- */
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'employees':
        return <EmployeeManagement employees={employees} setEmployees={setEmployees} />;
      case 'novelties':
        return (
          <NoveltyManagement
            employees={employees}
            novelties={novelties}
            setNovelties={setNovelties}

          />
        );
      case 'advances':
        return (
          <AdvanceManagement
            employees={employees}
            advances={advances}
            setAdvances={setAdvances}
          />
        );
      case 'calculator':
        return (
          <PayrollCalculator
            employees={employees}
            novelties={novelties}
            advances={advances}
            deductionRates={deductionRates}
            payrollCalculations={payrollCalculations}
            setPayrollCalculations={setPayroll}
          />
        );
      case 'preview':
        return <PayrollPreview payrollCalculations={payrollCalculations} advances={advances} />;
      case 'settings':
        return (
          <SettingsManagement
            deductionRates={deductionRates}
            setDeductionRates={setDeductionRates}
          />
        );
      default:
        return null;
    }
  };

  /* -----------------------------------------------------------------------
     UI
  ----------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
<Navigation
  activeSection={activeSection}
  setActiveSection={(section: string) => {
    if (
      section === "employees" ||
      section === "novelties" ||
      section === "advances" ||
      section === "calculator" ||
      section === "preview" ||
      section === "settings"
    ) {
      setActiveSection(section);
    }
  }}
/>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveSection()}
      </main>
    </div>
  );
}

export default App;

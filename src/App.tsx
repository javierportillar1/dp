import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { EmployeeManagement } from './components/EmployeeManagement';
import { NoveltyManagement } from './components/NoveltyManagement';
import { AdvanceManagement } from './components/AdvanceManagement';
import { PayrollCalculator } from './components/PayrollCalculator';
import { PayrollPreview } from './components/PayrollPreview';
import { SettingsManagement } from './components/SettingsManagement';
import { Employee, Novelty, PayrollCalculation, AdvancePayment, DeductionRates, DEFAULT_DEDUCTION_RATES } from './types';

function App() {
  const [activeSection, setActiveSection] = useState('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [novelties, setNovelties] = useState<Novelty[]>([]);
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [payrollCalculations, setPayrollCalculations] = useState<PayrollCalculation[]>([]);
  const [deductionRates, setDeductionRates] = useState<DeductionRates>(DEFAULT_DEDUCTION_RATES);

  // Update worked days for all employees based on current date
  // React.useEffect(() => {
  //   const updateWorkedDays = () => {
  //     const updatedEmployees = employees.map(employee => {
  //       if (!employee.createdDate) return employee;
        
  //       const created = new Date(employee.createdDate);
  //       const now = new Date();
        
  //       // Colombia timezone offset (UTC-5)
  //       const colombiaOffset = -5 * 60;
  //       const createdColombia = new Date(created.getTime() + (colombiaOffset * 60 * 1000));
  //       const nowColombia = new Date(now.getTime() + (colombiaOffset * 60 * 1000));
        
  //       const diffTime = nowColombia.getTime() - createdColombia.getTime();
  //       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //       const workedDays = Math.max(1, Math.min(30, diffDays));
        
  //       // Subtract any novelty deductions
  //       const employeeNovelties = novelties.filter(n => n.employeeId === employee.id);
  //       const discountedDays = employeeNovelties.reduce((sum, n) => sum + n.discountDays, 0);
  //       const finalWorkedDays = Math.max(0, workedDays - discountedDays);
        
  //       return { ...employee, workedDays: finalWorkedDays };
  //     });
      
  //     setEmployees(updatedEmployees);
  //   };

  //   // Update worked days every hour
  //   const interval = setInterval(updateWorkedDays, 60 * 60 * 1000);
  //   updateWorkedDays(); // Initial update
    
  //   return () => clearInterval(interval);
  // }, [employees.length, novelties]); // Only depend on employee count and novelties

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
            setEmployees={setEmployees}
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
            setPayrollCalculations={setPayrollCalculations}
            payrollCalculations={payrollCalculations}
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
        return <EmployeeManagement employees={employees} setEmployees={setEmployees} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveSection()}
      </main>
    </div>
  );
}

export default App;

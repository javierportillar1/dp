import React, { useState } from 'react';
import { Calculator, Download, AlertCircle, TrendingUp, CreditCard, ZoomIn, ZoomOut } from 'lucide-react';
import { Employee, Novelty, PayrollCalculation, AdvancePayment, DeductionRates, MINIMUM_SALARY_COLOMBIA } from '../types';
import { getDaysInMonth, formatMonthYear, parseMonthString, isEmployeeActiveInMonth } from '../utils/dateUtils';
import { roundToNearest500Or1000 } from '../utils/financeUtils';

const PAYROLL_DAYS = 30;


interface PayrollCalculatorProps {
  employees: Employee[];
  novelties: Novelty[];
  advances: AdvancePayment[];
  deductionRates: DeductionRates;
  setPayrollCalculations: (calculations: PayrollCalculation[]) => void;
  payrollCalculations: PayrollCalculation[];
}

export const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({ 
  employees, 
  novelties, 
  advances,
  deductionRates,
  setPayrollCalculations,
  payrollCalculations 
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isCalculating, setIsCalculating] = useState(false);
  const [tableZoom, setTableZoom] = useState(100);

  const calculatePayroll = () => {
    setIsCalculating(true);
    
    // Filter employees who were active (hired before or during) the selected month
    const activeEmployees = employees.filter(employee => 
      isEmployeeActiveInMonth(employee, selectedMonth)
    );
    
    const calculations: PayrollCalculation[] = activeEmployees.map(employee => {
      // Get all novelties for this employee
      const allEmployeeNovelties = novelties.filter(n => n.employeeId === employee.id);
      
      // Get novelties that apply to the selected month
      const monthlyNovelties = allEmployeeNovelties.filter(n => {
        const noveltyMonth = n.date.slice(0, 7);
        
        // If it's a recurring license, check if it should apply to this month
        if (n.isRecurring && n.startMonth) {
          return n.startMonth <= selectedMonth;
        }
        
        // For non-recurring novelties, only include if they're for this specific month
        return noveltyMonth === selectedMonth;
      });
      
      // For recurring licenses, create a virtual novelty for this month if it doesn't exist
      const recurringLicenses = allEmployeeNovelties.filter(n => 
        n.isRecurring && 
        n.startMonth && 
        n.startMonth <= selectedMonth &&
        n.type === 'STUDY_LICENSE'
      );
      
      // Add recurring licenses that don't have a specific entry for this month
      recurringLicenses.forEach(license => {
        const existsForThisMonth = monthlyNovelties.some(n => 
          n.type === 'STUDY_LICENSE' && 
          n.date.startsWith(selectedMonth)
        );
        
        if (!existsForThisMonth) {
          monthlyNovelties.push({
            ...license,
            id: `recurring-${license.id}-${selectedMonth}`,
            date: `${selectedMonth}-01`,
            description: `${license.description} (Licencia recurrente desde ${license.startMonth})`
          });
        }
      });
      
      const employeeAdvances = advances.filter(a => a.employeeId === employee.id && a.month === selectedMonth);
      
      // Calculate worked days for the month (total days in month, minus absences from THIS month)
      const monthlyDiscountedDays = monthlyNovelties.reduce((sum, n) => sum + n.discountDays, 0);
      
      // For new employees, calculate proportional days based on hire date
      let workedDaysThisMonth = PAYROLL_DAYS;
      
      if (employee.createdDate) {
        const hireDate = new Date(employee.createdDate);
        const { year: selectedYear, month: selectedMonthNum } = parseMonthString(selectedMonth);
        const monthStart = new Date(selectedYear, selectedMonthNum - 1, 1);
        const monthEnd = new Date(selectedYear, selectedMonthNum, 0);
        
        // If hired during this month, calculate proportional days
        if (hireDate >= monthStart && hireDate <= monthEnd) {
          const daysFromHire = monthEnd.getDate() - hireDate.getDate() + 1;
          workedDaysThisMonth = Math.max(0, daysFromHire - monthlyDiscountedDays);
        } else {
          // If hired before this month, use full month minus absences
          workedDaysThisMonth = Math.max(0, PAYROLL_DAYS - monthlyDiscountedDays);
        }
      } else {
        workedDaysThisMonth = Math.max(0, PAYROLL_DAYS - monthlyDiscountedDays);
      }
      

      // Calculate daily values and round immediately to avoid decimals
      const dailySalary = roundToNearest500Or1000(employee.salary / PAYROLL_DAYS); // Always use 30 for daily salary calculation

      // Calculate gross salary based on worked days this month
      const grossSalary = roundToNearest500Or1000(dailySalary * workedDaysThisMonth);

      // Calculate daily transport allowance using configurable rate

      const dailyTransportAllowance = roundToNearest500Or1000(
        deductionRates.transportAllowance / PAYROLL_DAYS
      );

      // Transport allowance (only for NOMINA employees earning less than 2 minimum salaries)
      const transportAllowance = (
        employee.contractType === 'NOMINA' &&
        employee.salary < (MINIMUM_SALARY_COLOMBIA * 2)
        ) ? roundToNearest500Or1000(dailyTransportAllowance * workedDaysThisMonth) : 0;
        
      // Calculate bonuses from novelties of this month
      const bonusCalculations = calculateBonuses(monthlyNovelties, deductionRates);
      
      // Calculate deductions using configurable rates
      const healthDeduction = roundToNearest500Or1000(grossSalary * (deductionRates.health / 100));
      const pensionDeduction = employee.isPensioned ? 0 : roundToNearest500Or1000(grossSalary * (deductionRates.pension / 100));
      const solidarityDeduction = employee.salary >= (MINIMUM_SALARY_COLOMBIA * 4) ?
        roundToNearest500Or1000(grossSalary * (deductionRates.solidarity / 100)) : 0;

      const absenceDeduction = roundToNearest500Or1000(dailySalary * monthlyDiscountedDays);

      const planCorporativo = monthlyNovelties
        .filter(n => n.type === 'PLAN_CORPORATIVO')
        .reduce((sum, n) => sum + roundToNearest500Or1000(n.bonusAmount), 0);
        // .reduce((sum, n) => sum + n.bonusAmount, 0);
        
        const recordar = monthlyNovelties
        .filter(n => n.type === 'RECORDAR')
        .reduce((sum, n) => sum + roundToNearest500Or1000(n.bonusAmount), 0);
        // .reduce((sum, n) => sum + n.bonusAmount, 0);
        const inventariosCruces = monthlyNovelties
        .filter(n => n.type === 'INVENTARIOS_CRUCES')
        .reduce((sum, n) => sum + roundToNearest500Or1000(n.bonusAmount), 0);
        // .reduce((sum, n) => sum + n.bonusAmount, 0);
        const multas = monthlyNovelties
        .filter(n => n.type === 'MULTAS')
        .reduce((sum, n) => sum + roundToNearest500Or1000(n.bonusAmount), 0);
        // .reduce((sum, n) => sum + n.bonusAmount, 0);
        const fondoEmpleadosDed = monthlyNovelties
        .filter(n => n.type === 'FONDO_EMPLEADOS')
        .reduce((sum, n) => sum + roundToNearest500Or1000(n.bonusAmount), 0);
        // .reduce((sum, n) => sum + n.bonusAmount, 0);
        const carteraEmpleadosDed = monthlyNovelties
        .filter(n => n.type === 'CARTERA_EMPLEADOS')
        .reduce((sum, n) => sum + roundToNearest500Or1000(n.bonusAmount), 0);
        // .reduce((sum, n) => sum + n.bonusAmount, 0);

      const totalAdvances = roundToNearest500Or1000(
        employeeAdvances.reduce((sum, adv) => sum + adv.amount, 0)
      );

      const totalDeductions = roundToNearest500Or1000(
        healthDeduction +
        pensionDeduction +
        solidarityDeduction +
        absenceDeduction +
        planCorporativo +
        recordar +
        inventariosCruces +
        multas +
        fondoEmpleadosDed +
        carteraEmpleadosDed +
        totalAdvances
      );
      
      const rawTotalEarned = grossSalary + transportAllowance + bonusCalculations.total;
      const totalEarned = roundToNearest500Or1000(rawTotalEarned);
      const netSalary = roundToNearest500Or1000(totalEarned - totalDeductions);
      
      return {
        employee,
        workedDays: workedDaysThisMonth,
        totalDaysInMonth: PAYROLL_DAYS,
        baseSalary: employee.salary,
        discountedDays: monthlyDiscountedDays,
        transportAllowance,
        grossSalary,
        totalEarned,
        bonuses: bonusCalculations.total,
        deductions: {
          health: healthDeduction,
          pension: pensionDeduction,
          solidarity: solidarityDeduction,
          absence: absenceDeduction,
          advance: totalAdvances,
          planCorporativo,
          recordar,
          inventariosCruces,
          multas,
          fondoEmpleados: fondoEmpleadosDed,
          carteraEmpleados: carteraEmpleadosDed,
          total: totalDeductions,
        },
        netSalary: netSalary,
        novelties: monthlyNovelties,
        bonusCalculations,
      };
    });
    
    setPayrollCalculations(calculations);
    setIsCalculating(false);
  };

  const calculateBonuses = (novelties: Novelty[], rates: DeductionRates) => {
    const calculations = {
      fixedCompensation: 0,
      salesBonus: 0,
      fixedOvertime: 0,
      unexpectedOvertime: 0,
      nightSurcharge: 0,
      sundayWork: 0,
      gasAllowance: 0,
      studyLicense: 0,
      total: 0
    };

    novelties.forEach(novelty => {
      switch (novelty.type) {
        case 'FIXED_COMPENSATION':
          calculations.fixedCompensation += roundToNearest500Or1000(novelty.bonusAmount);
          break;
        case 'SALES_BONUS':
          calculations.salesBonus += roundToNearest500Or1000(novelty.bonusAmount);
          break;
        case 'FIXED_OVERTIME': {
          // Horas extra fijas: horas × hora ordinaria
          const fixedOvertimeAmount = roundToNearest500Or1000(
            novelty.bonusAmount || ((novelty.hours || 0) * rates.ordinaryHour)
          );
          calculations.fixedOvertime += fixedOvertimeAmount;
          break;
        }
        case 'UNEXPECTED_OVERTIME': {
          // Horas extra NE: horas × horas extra
          const unexpectedOvertimeAmount = roundToNearest500Or1000(
            novelty.bonusAmount || ((novelty.hours || 0) * rates.overtime)
          );
          calculations.unexpectedOvertime += unexpectedOvertimeAmount;
          break;
        }
        case 'NIGHT_SURCHARGE': {
          // Recargos nocturnos: horas × recargos nocturnos
          const nightSurchargeAmount = roundToNearest500Or1000(
            novelty.bonusAmount || ((novelty.hours || 0) * rates.nightSurcharge)
          );
          calculations.nightSurcharge += nightSurchargeAmount;
          break;
        }
        case 'SUNDAY_WORK': {
          // Festivos: días × dominical 1
          const sundayWorkAmount = roundToNearest500Or1000(
            novelty.bonusAmount || ((novelty.days || 0) * rates.sunday1)
          );
          calculations.sundayWork += sundayWorkAmount;
          break;
        }
        case 'GAS_ALLOWANCE':
          calculations.gasAllowance += roundToNearest500Or1000(novelty.bonusAmount);
          break;
        case 'STUDY_LICENSE':
          calculations.studyLicense += roundToNearest500Or1000(novelty.bonusAmount);
          break;
      }
    });

    calculations.total = roundToNearest500Or1000(
      calculations.fixedCompensation + calculations.salesBonus +
      calculations.fixedOvertime + calculations.unexpectedOvertime +
      calculations.nightSurcharge + calculations.sundayWork +
      calculations.gasAllowance + calculations.studyLicense
    );

    return calculations;
  };

  const exportToTxt = () => {
    const date = new Date(selectedDate);
    const monthFormatted = formatMonthYear(selectedMonth);
    const { year, month } = parseMonthString(selectedMonth);
    const daysInMonth = getDaysInMonth(year, month);
    
    let txtContent = `NOMINA - ${monthFormatted}\n`;
    txtContent += `Fecha de procesamiento: ${date.toLocaleDateString()}\n`;
    txtContent += `Días del mes: ${daysInMonth}\n`;
    txtContent += `Configuración de deducciones:\n`;
    txtContent += `  - Salud: ${deductionRates.health}%\n`;
    txtContent += `  - Pensión: ${deductionRates.pension}%\n`;
    txtContent += `  - Solidaridad: ${deductionRates.solidarity}%\n`;
    txtContent += `  - Auxilio de Transporte: $${deductionRates.transportAllowance.toLocaleString()}\n`;
    txtContent += `${'='.repeat(80)}\n\n`;
    
    payrollCalculations.forEach((calc, index) => {
      txtContent += `${index + 1}. ${calc.employee.name}\n`;
      txtContent += `   Cédula: ${calc.employee.cedula}\n`;
      txtContent += `   Contrato: ${calc.employee.contractType}\n`;
      txtContent += `   Salario Base: $${(calc.baseSalary ?? 0).toLocaleString()}\n`;
      txtContent += `   Días Trabajados del Mes: ${calc.workedDays}/${calc.totalDaysInMonth}\n`;
      txtContent += `   Días Trabajados Totales: ${calc.employee.workedDays}\n`;
      txtContent += `   Días Descontados: ${calc.discountedDays}\n`;
      txtContent += `   Salario Bruto: $${(calc.grossSalary ?? 0).toLocaleString()}\n`;
      txtContent += `   Auxilio Transporte: $${(calc.transportAllowance ?? 0).toLocaleString()}\n`;
      if (calc.bonusCalculations.total > 0) {
        txtContent += `   Adiciones:\n`;
        if (calc.bonusCalculations.fixedCompensation > 0) {
          txtContent += `     - Compensatorios fijos: $${calc.bonusCalculations.fixedCompensation.toLocaleString()}\n`;
        }
        if (calc.bonusCalculations.salesBonus > 0) {
          txtContent += `     - Bonificación en venta: $${calc.bonusCalculations.salesBonus.toLocaleString()}\n`;
        }
        if (calc.bonusCalculations.fixedOvertime > 0) {
          txtContent += `     - Horas extra fijas: $${calc.bonusCalculations.fixedOvertime.toLocaleString()}\n`;
        }
        if (calc.bonusCalculations.unexpectedOvertime > 0) {
          txtContent += `     - Horas extra NE: $${calc.bonusCalculations.unexpectedOvertime.toLocaleString()}\n`;
        }
        if (calc.bonusCalculations.nightSurcharge > 0) {
          txtContent += `     - Recargos nocturnos: $${calc.bonusCalculations.nightSurcharge.toLocaleString()}\n`;
        }
        if (calc.bonusCalculations.sundayWork > 0) {
          txtContent += `     - Festivos: $${calc.bonusCalculations.sundayWork.toLocaleString()}\n`;
        }
        if (calc.bonusCalculations.gasAllowance > 0) {
          txtContent += `     - Auxilio de gasolina: $${calc.bonusCalculations.gasAllowance.toLocaleString()}\n`;
        }
        txtContent += `     - Total Adiciones: $${calc.bonusCalculations.total.toLocaleString()}\n`;
      }
      txtContent += `   Deducciones:\n`;
      txtContent += `     - Salud (${deductionRates.health}%): $${(calc.deductions?.health ?? 0).toLocaleString()}\n`;
      txtContent += `     - Pensión (${deductionRates.pension}%): $${(calc.deductions?.pension ?? 0).toLocaleString()}\n`;
      if ((calc.deductions?.solidarity ?? 0) > 0) {
        txtContent += `     - Solidaridad (${deductionRates.solidarity}%): $${(calc.deductions?.solidarity ?? 0).toLocaleString()}\n`;
      }
      if ((calc.deductions?.absence ?? 0) > 0) {
        txtContent += `     - Ausencias: $${(calc.deductions?.absence ?? 0).toLocaleString()}\n`;
      }
      if ((calc.deductions?.planCorporativo ?? 0) > 0) {
        txtContent += `     - Plan corporativo: $${(calc.deductions?.planCorporativo ?? 0).toLocaleString()}\n`;
      }
      if ((calc.deductions?.recordar ?? 0) > 0) {
        txtContent += `     - Recordar: $${(calc.deductions?.recordar ?? 0).toLocaleString()}\n`;
      }
      if ((calc.deductions?.inventariosCruces ?? 0) > 0) {
        txtContent += `     - Inventarios y cruces: $${(calc.deductions?.inventariosCruces ?? 0).toLocaleString()}\n`;
      }
      if ((calc.deductions?.multas ?? 0) > 0) {
        txtContent += `     - Multas: $${(calc.deductions?.multas ?? 0).toLocaleString()}\n`;
      }
      if ((calc.deductions?.fondoEmpleados ?? 0) > 0) {
        txtContent += `     - Fondo empleados: $${(calc.deductions?.fondoEmpleados ?? 0).toLocaleString()}\n`;
      }
      if ((calc.deductions?.carteraEmpleados ?? 0) > 0) {
        txtContent += `     - Cartera empleados: $${(calc.deductions?.carteraEmpleados ?? 0).toLocaleString()}\n`;
      }
      if ((calc.deductions?.advance ?? 0) > 0) {
        txtContent += `     - Anticipo Quincena: $${(calc.deductions?.advance ?? 0).toLocaleString()}\n`;
      }
      txtContent += `     - Total Deducciones: $${(calc.deductions?.total ?? 0).toLocaleString()}\n`;
      txtContent += `   SALARIO NETO: $${(calc.netSalary ?? 0).toLocaleString()}\n`;
      
      if (calc.novelties.length > 0) {
        txtContent += `   Novedades:\n`;
        calc.novelties.forEach(novelty => {
          txtContent += `     - ${novelty.date}: ${novelty.type} (${novelty.discountDays} días) - ${novelty.description || 'Sin descripción'}\n`;
        });
      }
      
      const employeeAdvances = advances.filter(a => a.employeeId === calc.employee.id && a.month === selectedMonth);
      if (employeeAdvances.length > 0) {
        txtContent += `   Anticipo Quincena del mes:\n`;
        employeeAdvances.forEach(advance => {
          txtContent += `     - ${advance.date}: $${advance.amount.toLocaleString()} - ${advance.description || 'Sin descripción'}\n`;
        });
      }
      
      txtContent += `\n${'-'.repeat(50)}\n\n`;
    });
    
    const totalNet = payrollCalculations.reduce((sum, calc) => sum + (calc.netSalary ?? 0), 0);
    const totalAdvancesMonth = advances
      .filter(a => a.month === selectedMonth)
      .reduce((sum, advance) => sum + advance.amount, 0);

    txtContent += `RESUMEN:\n`;
    txtContent += `Total Salarios Brutos: $${payrollCalculations.reduce((sum, calc) => sum + (calc.grossSalary ?? 0), 0).toLocaleString()}\n`;
    txtContent += `Total Deducciones: $${payrollCalculations.reduce((sum, calc) => sum + (calc.deductions?.total ?? 0), 0).toLocaleString()}\n`;
    txtContent += `Total Anticipo Quincena: $${totalAdvancesMonth.toLocaleString()}\n`;
    txtContent += `TOTAL NÓMINA NETA: $${totalNet.toLocaleString()}\n`;
    
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nomina_${month}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPayroll = payrollCalculations.reduce((sum, calc) => sum + (calc.netSalary ?? 0), 0);
  const totalAdvancesMonth = advances
    .filter(a => a.month === selectedMonth)
    .reduce((sum, advance) => sum + advance.amount - (advance.employeeFund || 0) - (advance.employeeLoan || 0), 0);

  const handleZoomIn = () => {
    setTableZoom(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setTableZoom(prev => Math.max(prev - 10, 60));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Calculador de Nómina</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes de Nómina
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Cálculo
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={calculatePayroll}
            disabled={isCalculating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Calculator className="h-4 w-4" />
            <span>{isCalculating ? 'Calculando...' : 'Calcular Nómina'}</span>
          </button>
        </div>
      </div>

      {payrollCalculations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resumen de Nómina - {formatMonthYear(selectedMonth)}</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                <button
                  onClick={handleZoomOut}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Reducir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium px-2">{tableZoom}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={exportToTxt}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Exportar TXT</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Total Nómina</span>
              </div>
              <p className="text-2xl font-bold text-green-900">${totalPayroll.toLocaleString()}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Empleados</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Novedades</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{novelties.length}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Anticipo Quincena</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">${totalAdvancesMonth.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="overflow-x-auto" style={{ fontSize: `${tableZoom}%` }}>
            <div className="min-w-full" style={{ overflowX: 'scroll' }}>
              <table className="w-full" style={{ fontSize: `${tableZoom / 100}em` }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sueldo Básico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Días Trabajados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sueldo Mes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aux. Transporte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adiciones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Devengado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salud</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pensión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ausencias $</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Corp.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recordar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventarios</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Multas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aporte Fondo Emp.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera Emp.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anticipo Quincena</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ded.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salario Neto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrollCalculations.map((calc) => (
                    <tr key={calc.employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {calc.employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {calc.employee.contractType}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(calc.baseSalary ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <span className="font-medium">{calc.workedDays}/{calc.totalDaysInMonth}</span>
                          {calc.discountedDays > 0 && (
                            <div className="text-red-600 text-xs">
                              -{calc.discountedDays} días descontados
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(calc.grossSalary ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(calc.transportAllowance ?? 0) > 0 ? (
                          <span className="text-green-600 font-medium">+${(calc.transportAllowance ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(calc.bonusCalculations?.total || 0) > 0 ? (
                          <div className="space-y-1">
                            {(calc.bonusCalculations?.fixedCompensation || 0) > 0 && (
                              <div className="text-green-600 text-xs">Compensatorios: +${(calc.bonusCalculations?.fixedCompensation || 0).toLocaleString()}</div>
                            )}
                            {(calc.bonusCalculations?.salesBonus || 0) > 0 && (
                              <div className="text-green-600 text-xs">Bonif. venta: +${(calc.bonusCalculations?.salesBonus || 0).toLocaleString()}</div>
                            )}
                            {(calc.bonusCalculations?.fixedOvertime || 0) > 0 && (
                              <div className="text-green-600 text-xs">
                                H. extra fijas {(() => {
                                  const hoursNovelty = calc.novelties.find(n => n.type === 'FIXED_OVERTIME');
                                  return hoursNovelty?.hours ? `(${hoursNovelty.hours} horas)` : '';
                                })()}: +${(calc.bonusCalculations?.fixedOvertime || 0).toLocaleString()}
                              </div>
                            )}
                            {(calc.bonusCalculations?.unexpectedOvertime || 0) > 0 && (
                              <div className="text-green-600 text-xs">
                                H. extra NE {(() => {
                                  const hoursNovelty = calc.novelties.find(n => n.type === 'UNEXPECTED_OVERTIME');
                                  return hoursNovelty?.hours ? `(${hoursNovelty.hours} horas)` : '';
                                })()}: +${(calc.bonusCalculations?.unexpectedOvertime || 0).toLocaleString()}
                              </div>
                            )}
                            {(calc.bonusCalculations?.nightSurcharge || 0) > 0 && (
                              <div className="text-green-600 text-xs">
                                Recargos noc. {(() => {
                                  const hoursNovelty = calc.novelties.find(n => n.type === 'NIGHT_SURCHARGE');
                                  return hoursNovelty?.hours ? `(${hoursNovelty.hours} horas)` : '';
                                })()}: +${(calc.bonusCalculations?.nightSurcharge || 0).toLocaleString()}
                              </div>
                            )}
                            {(calc.bonusCalculations?.sundayWork || 0) > 0 && (
                              <div className="text-green-600 text-xs">
                                Festivos {(() => {
                                  const daysNovelty = calc.novelties.find(n => n.type === 'SUNDAY_WORK');
                                  return daysNovelty?.days ? `(${daysNovelty.days} días)` : '';
                                })()}: +${(calc.bonusCalculations?.sundayWork || 0).toLocaleString()}
                              </div>
                            )}
                            {(calc.bonusCalculations?.gasAllowance || 0) > 0 && (
                              <div className="text-green-600 text-xs">Aux. gasolina: +${(calc.bonusCalculations?.gasAllowance || 0).toLocaleString()}</div>
                            )}
                            {(calc.bonusCalculations?.studyLicense || 0) > 0 && (
                              <div className="text-green-600 text-xs">Lic. estudio: +${(calc.bonusCalculations?.studyLicense || 0).toLocaleString()}</div>
                            )}
                            <div className="font-medium text-green-600 border-t pt-1">
                              Total: +${(calc.bonusCalculations?.total || 0).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        ${(calc.totalEarned ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.health ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.health ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.pension ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.pension ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.absence ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.absence ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.planCorporativo ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.planCorporativo ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.recordar ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.recordar ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.inventariosCruces ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.inventariosCruces ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.multas ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.multas ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.fondoEmpleados ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.fondoEmpleados ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.carteraEmpleados ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.carteraEmpleados ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(calc.deductions?.advance ?? 0) > 0 ? (
                          <span className="text-red-600">-${(calc.deductions?.advance ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">${(calc.deductions?.total ?? 0).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        ${(calc.netSalary ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {payrollCalculations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
          <Calculator className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nómina no calculada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Haz clic en "Calcular Nómina" para procesar los salarios del mes seleccionado.
          </p>
        </div>
      )}
    </div>
  );
};
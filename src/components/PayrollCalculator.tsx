import React, { useState } from 'react';
import { Calculator, Download, AlertCircle, TrendingUp, CreditCard } from 'lucide-react';
import { Employee, Novelty, PayrollCalculation, AdvancePayment, DeductionRates, MINIMUM_SALARY_COLOMBIA, TRANSPORT_ALLOWANCE } from '../types';
import { getDaysInMonth, formatMonthYear, parseMonthString, isEmployeeActiveInMonth } from '../utils/dateUtils';

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

  const calculatePayroll = () => {
    setIsCalculating(true);
    
    const { year, month } = parseMonthString(selectedMonth);
    const daysInMonth = getDaysInMonth(year, month);
    
    // Filter employees who were active (hired before or during) the selected month
    const activeEmployees = employees.filter(employee => 
      isEmployeeActiveInMonth(employee, selectedMonth)
    );
    
    const calculations: PayrollCalculation[] = activeEmployees.map(employee => {
      const employeeNovelties = novelties.filter(n => n.employeeId === employee.id);
      const employeeAdvances = advances.filter(a => a.employeeId === employee.id && a.month === selectedMonth);
      
      // Calculate worked days for the month (total days in month, minus absences from THIS month)
      const monthlyNovelties = employeeNovelties.filter(n => n.date.startsWith(selectedMonth));
      const monthlyDiscountedDays = monthlyNovelties.reduce((sum, n) => sum + n.discountDays, 0);
      const workedDaysThisMonth = Math.max(0, daysInMonth - monthlyDiscountedDays);
      
      // Calculate daily salary
      const dailySalary = employee.salary / 30; // Always use 30 for daily salary calculation
      
      // Calculate gross salary based on worked days this month
      const grossSalary = dailySalary * workedDaysThisMonth;
      
      // Transport allowance (only for NOMINA employees earning less than 2 minimum salaries)
      const transportAllowance = (
        employee.contractType === 'NOMINA' && 
        employee.salary < (MINIMUM_SALARY_COLOMBIA * 2)
      ) ? (deductionRates.transportAllowance * workedDaysThisMonth) / 30 : 0;
      
      // Calculate bonuses from novelties of this month
      const bonusCalculations = calculateBonuses(monthlyNovelties, deductionRates);
      const bonuses = bonusCalculations.total;
      
      // Calculate deductions using configurable rates
      const healthDeduction = grossSalary * (deductionRates.health / 100);
      const pensionDeduction = grossSalary * (deductionRates.pension / 100);
      const solidarityDeduction = employee.salary >= (MINIMUM_SALARY_COLOMBIA * 4) ? 
        grossSalary * (deductionRates.solidarity / 100) : 0;
      
      // Calculate total advances for this month
      const totalAdvances = employeeAdvances.reduce((sum, advance) => sum + advance.amount, 0);
      
      const totalDeductions = healthDeduction + pensionDeduction + solidarityDeduction + totalAdvances;
      const netSalary = grossSalary + transportAllowance + bonusCalculations.total - totalDeductions;
      
      return {
        employee,
        workedDays: workedDaysThisMonth,
        totalDaysInMonth: daysInMonth,
        baseSalary: employee.salary,
        discountedDays: monthlyDiscountedDays,
        transportAllowance,
        grossSalary,
        bonuses: bonusCalculations.total,
        deductions: {
          health: healthDeduction,
          pension: pensionDeduction,
          solidarity: solidarityDeduction,
          advance: totalAdvances,
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
      total: 0
    };

    novelties.forEach(novelty => {
      switch (novelty.type) {
        case 'FIXED_COMPENSATION':
          calculations.fixedCompensation += novelty.bonusAmount;
          break;
        case 'SALES_BONUS':
          calculations.salesBonus += novelty.bonusAmount;
          break;
        case 'FIXED_OVERTIME':
          // Horas extra fijas: horas × hora ordinaria
          const fixedOvertimeAmount = (novelty.hours || 0) * rates.ordinaryHour;
          calculations.fixedOvertime += fixedOvertimeAmount;
          break;
        case 'UNEXPECTED_OVERTIME':
          // Horas extra NE: horas × horas extra
          const unexpectedOvertimeAmount = (novelty.hours || 0) * rates.overtime;
          calculations.unexpectedOvertime += unexpectedOvertimeAmount;
          break;
        case 'NIGHT_SURCHARGE':
          // Recargos nocturnos: horas × recargos nocturnos
          const nightSurchargeAmount = (novelty.hours || 0) * rates.nightSurcharge;
          calculations.nightSurcharge += nightSurchargeAmount;
          break;
        case 'SUNDAY_WORK':
          // Festivos: días × dominical 1
          const sundayWorkAmount = (novelty.days || 0) * rates.sunday1;
          calculations.sundayWork += sundayWorkAmount;
          break;
        case 'GAS_ALLOWANCE':
          calculations.gasAllowance += novelty.bonusAmount;
          break;
      }
    });

    calculations.total = calculations.fixedCompensation + calculations.salesBonus + 
                       calculations.fixedOvertime + calculations.unexpectedOvertime + 
                       calculations.nightSurcharge + calculations.sundayWork + 
                       calculations.gasAllowance;

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
      txtContent += `   Salario Base: $${calc.baseSalary.toLocaleString()}\n`;
      txtContent += `   Días Trabajados del Mes: ${calc.workedDays}/${calc.totalDaysInMonth}\n`;
      txtContent += `   Días Trabajados Totales: ${calc.employee.workedDays}\n`;
      txtContent += `   Días Descontados: ${calc.discountedDays}\n`;
      txtContent += `   Salario Bruto: $${calc.grossSalary.toLocaleString()}\n`;
      txtContent += `   Auxilio Transporte: $${calc.transportAllowance.toLocaleString()}\n`;
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
      txtContent += `     - Salud (${deductionRates.health}%): $${calc.deductions.health.toLocaleString()}\n`;
      txtContent += `     - Pensión (${deductionRates.pension}%): $${calc.deductions.pension.toLocaleString()}\n`;
      if (calc.deductions.solidarity > 0) {
        txtContent += `     - Solidaridad (${deductionRates.solidarity}%): $${calc.deductions.solidarity.toLocaleString()}\n`;
      }
      if (calc.deductions.advance > 0) {
        txtContent += `     - Adelantos: $${calc.deductions.advance.toLocaleString()}\n`;
      }
      txtContent += `     - Total Deducciones: $${calc.deductions.total.toLocaleString()}\n`;
      txtContent += `   SALARIO NETO: $${calc.netSalary.toLocaleString()}\n`;
      
      if (calc.novelties.length > 0) {
        txtContent += `   Novedades:\n`;
        calc.novelties.forEach(novelty => {
          txtContent += `     - ${novelty.date}: ${novelty.type} (${novelty.discountDays} días) - ${novelty.description || 'Sin descripción'}\n`;
        });
      }
      
      const employeeAdvances = advances.filter(a => a.employeeId === calc.employee.id && a.month === selectedMonth);
      if (employeeAdvances.length > 0) {
        txtContent += `   Adelantos del mes:\n`;
        employeeAdvances.forEach(advance => {
          txtContent += `     - ${advance.date}: $${advance.amount.toLocaleString()} - ${advance.description || 'Sin descripción'}\n`;
        });
      }
      
      txtContent += `\n${'-'.repeat(50)}\n\n`;
    });
    
    const totalNet = payrollCalculations.reduce((sum, calc) => sum + calc.netSalary, 0);
    const totalAdvancesMonth = advances
      .filter(a => a.month === selectedMonth)
      .reduce((sum, advance) => sum + advance.amount, 0);
    
    txtContent += `RESUMEN:\n`;
    txtContent += `Total Salarios Brutos: $${payrollCalculations.reduce((sum, calc) => sum + calc.grossSalary, 0).toLocaleString()}\n`;
    txtContent += `Total Deducciones: $${payrollCalculations.reduce((sum, calc) => sum + calc.deductions.total, 0).toLocaleString()}\n`;
    txtContent += `Total Adelantos: $${totalAdvancesMonth.toLocaleString()}\n`;
    txtContent += `TOTAL NÓMINA NETA: $${totalNet.toLocaleString()}\n`;
    
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nomina_${month}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPayroll = payrollCalculations.reduce((sum, calc) => sum + calc.netSalary, 0);
  const totalAdvancesMonth = advances
    .filter(a => a.month === selectedMonth)
    .reduce((sum, advance) => sum + advance.amount, 0);

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
            <button
              onClick={exportToTxt}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Exportar TXT</span>
            </button>
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
                <span className="text-sm font-medium text-purple-600">Adelantos</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">${totalAdvancesMonth.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días Trabajados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salario Bruto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aux. Transporte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adiciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deducciones
                  </th>
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
                      ${calc.grossSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${calc.transportAllowance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(calc.bonusCalculations?.total || 0) > 0 ? (
                        <div className="space-y-1">
                          {(calc.bonusCalculations?.fixedCompensation || 0) > 0 && (
                            <div className="text-green-600 text-xs">Compensatorios: ${(calc.bonusCalculations?.fixedCompensation || 0).toLocaleString()}</div>
                          )}
                          {(calc.bonusCalculations?.salesBonus || 0) > 0 && (
                            <div className="text-green-600 text-xs">Bonif. venta: ${(calc.bonusCalculations?.salesBonus || 0).toLocaleString()}</div>
                          )}
                          {(calc.bonusCalculations?.fixedOvertime || 0) > 0 && (
                            <div className="text-green-600 text-xs">H. extra fijas: ${(calc.bonusCalculations?.fixedOvertime || 0).toLocaleString()}</div>
                          )}
                          {(calc.bonusCalculations?.unexpectedOvertime || 0) > 0 && (
                            <div className="text-green-600 text-xs">H. extra NE: ${(calc.bonusCalculations?.unexpectedOvertime || 0).toLocaleString()}</div>
                          )}
                          {(calc.bonusCalculations?.nightSurcharge || 0) > 0 && (
                            <div className="text-green-600 text-xs">Recargos noc.: ${(calc.bonusCalculations?.nightSurcharge || 0).toLocaleString()}</div>
                          )}
                          {(calc.bonusCalculations?.sundayWork || 0) > 0 && (
                            <div className="text-green-600 text-xs">Festivos: ${(calc.bonusCalculations?.sundayWork || 0).toLocaleString()}</div>
                          )}
                          {(calc.bonusCalculations?.gasAllowance || 0) > 0 && (
                            <div className="text-green-600 text-xs">Aux. gasolina: ${(calc.bonusCalculations?.gasAllowance || 0).toLocaleString()}</div>
                          )}
                          <div className="font-medium text-green-600 border-t pt-1">
                            Total: ${(calc.bonusCalculations?.total || 0).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>Salud: ${calc.deductions.health.toLocaleString()}</div>
                        <div>Pensión: ${calc.deductions.pension.toLocaleString()}</div>
                        {calc.deductions.solidarity > 0 && (
                          <div>Solidaridad: ${calc.deductions.solidarity.toLocaleString()}</div>
                        )}
                        {calc.deductions.advance > 0 && (
                          <div className="text-purple-600">Adelantos: ${calc.deductions.advance.toLocaleString()}</div>
                        )}
                        <div className="font-medium border-t pt-1">
                          Total: ${calc.deductions.total.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${calc.netSalary.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
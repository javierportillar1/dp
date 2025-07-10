import React from 'react';
import { FileText, User, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { PayrollCalculation, AdvancePayment } from '../types';
import { formatMonthYear } from '../utils/dateUtils';

interface PayrollPreviewProps {
  payrollCalculations: PayrollCalculation[];
  advances: AdvancePayment[];
}

export const PayrollPreview: React.FC<PayrollPreviewProps> = ({ payrollCalculations }) => {
  const totalPayroll = payrollCalculations.reduce((sum, calc) => sum + calc.netSalary, 0);
  const totalDeductions = payrollCalculations.reduce((sum, calc) => sum + calc.deductions.total, 0);
  const totalTransportAllowance = payrollCalculations.reduce((sum, calc) => sum + calc.transportAllowance, 0);
  const totalAdvances = payrollCalculations.reduce((sum, calc) => sum + calc.deductions.advance, 0);
  const totalBonuses = payrollCalculations.reduce((sum, calc) => sum + (calc.bonusCalculations?.total || calc.bonuses || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Previsualización de Nómina</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Actualizado: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {payrollCalculations.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm font-medium">Total Nómina</span>
              </div>
              <p className="text-2xl font-bold">${totalPayroll.toLocaleString()}</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="h-6 w-6" />
                <span className="text-sm font-medium">Empleados</span>
              </div>
              <p className="text-2xl font-bold">{payrollCalculations.length}</p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-6 w-6" />
                <span className="text-sm font-medium">Deducciones</span>
              </div>
              <p className="text-2xl font-bold">${totalDeductions.toLocaleString()}</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium">Aux. Transporte</span>
              </div>
              <p className="text-2xl font-bold">${totalTransportAllowance.toLocaleString()}</p>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-6 w-6" />
                <span className="text-sm font-medium">Adelantos</span>
              </div>
              <p className="text-2xl font-bold">${totalAdvances.toLocaleString()}</p>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium">Bonificaciones</span>
              </div>
              <p className="text-2xl font-bold">${totalBonuses.toLocaleString()}</p>
            </div>
          </div>

          {/* Detailed Employee Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {payrollCalculations.map((calc) => (
              <div key={calc.employee.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{calc.employee.name}</h3>
                    <p className="text-sm text-gray-500">{calc.employee.contractType}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Salario Base</span>
                    <span className="font-medium">${calc.baseSalary.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Días Trabajados</span>
                    <span className="font-medium">
                      {calc.workedDays}/{calc.totalDaysInMonth}
                      {calc.discountedDays > 0 && (
                        <span className="text-red-600 ml-1">(-{calc.discountedDays})</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Salario Bruto</span>
                    <span className="font-medium">${calc.grossSalary.toLocaleString()}</span>
                  </div>
                  
                  {calc.transportAllowance > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Aux. Transporte</span>
                      <span className="font-medium text-green-600">${calc.transportAllowance.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {(calc.bonusCalculations?.total || calc.bonuses || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Adiciones</span>
                      <span className="font-medium text-green-600">${(calc.bonusCalculations?.total || calc.bonuses || 0).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Salud</span>
                      <span className="text-red-600">-${calc.deductions.health.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Pensión</span>
                      <span className="text-red-600">-${calc.deductions.pension.toLocaleString()}</span>
                    </div>
                    {calc.deductions.solidarity > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Solidaridad</span>
                        <span className="text-red-600">-${calc.deductions.solidarity.toLocaleString()}</span>
                      </div>
                    )}
                    {calc.deductions.advance > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Adelantos</span>
                        <span className="text-red-600">-${calc.deductions.advance.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-medium border-t pt-2 mt-2">
                      <span className="text-gray-900">Total Deducciones</span>
                      <span className="text-red-600">-${calc.deductions.total.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Salario Neto</span>
                      <span className="font-bold text-green-600 text-lg">${calc.netSalary.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {calc.novelties.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Novedades</h4>
                      <div className="space-y-1">
                        {calc.novelties.map((novelty) => (
                          <div key={novelty.id} className="text-xs text-gray-600">
                            <span className="font-medium">{new Date(novelty.date).toLocaleDateString()}</span>: {novelty.type}
                            {novelty.discountDays > 0 && (
                              <span className="text-red-600 ml-1">(-{novelty.discountDays} días)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {calc.bonusCalculations && calc.bonusCalculations.total > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Detalle de Adiciones</h4>
                      <div className="space-y-1">
                        {calc.bonusCalculations.fixedCompensation > 0 && (
                          <div className="text-xs text-green-600">
                            Compensatorios fijos: ${calc.bonusCalculations.fixedCompensation.toLocaleString()}
                          </div>
                        )}
                        {calc.bonusCalculations.salesBonus > 0 && (
                          <div className="text-xs text-green-600">
                            Bonificación en venta: ${calc.bonusCalculations.salesBonus.toLocaleString()}
                          </div>
                        )}
                        {calc.bonusCalculations.fixedOvertime > 0 && (
                          <div className="text-xs text-green-600">
                            Horas extra fijas: ${calc.bonusCalculations.fixedOvertime.toLocaleString()}
                          </div>
                        )}
                        {calc.bonusCalculations.unexpectedOvertime > 0 && (
                          <div className="text-xs text-green-600">
                            Horas extra NE: ${calc.bonusCalculations.unexpectedOvertime.toLocaleString()}
                          </div>
                        )}
                        {calc.bonusCalculations.nightSurcharge > 0 && (
                          <div className="text-xs text-green-600">
                            Recargos nocturnos: ${calc.bonusCalculations.nightSurcharge.toLocaleString()}
                          </div>
                        )}
                        {calc.bonusCalculations.sundayWork > 0 && (
                          <div className="text-xs text-green-600">
                            Festivos: ${calc.bonusCalculations.sundayWork.toLocaleString()}
                          </div>
                        )}
                        {calc.bonusCalculations.gasAllowance > 0 && (
                          <div className="text-xs text-green-600">
                            Auxilio de gasolina: ${calc.bonusCalculations.gasAllowance.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay nómina calculada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Ve a la sección "Calculador" para procesar la nómina de tus empleados.
          </p>
        </div>
      )}
    </div>
  );
};

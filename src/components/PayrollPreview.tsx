import React from 'react';
import { FileText, User, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { PayrollCalculation } from '../types';

interface PayrollPreviewProps {
  payrollCalculations: PayrollCalculation[];
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
                <span className="text-sm font-medium">Anticipo Quincena</span>
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

          {/* Detailed Employee Cards - New Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {payrollCalculations.map((calc) => (
              <div key={calc.employee.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{calc.employee.name}</h3>
                    <p className="text-sm text-gray-500">{calc.employee.contractType}</p>
                  </div>
                </div>
                
                {/* Devengar Section */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-3 text-center">DEVENGAR</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Días trabajados al mes</span>
                      <span className="font-medium">
                        {calc.workedDays}/{calc.totalDaysInMonth}
                        {calc.discountedDays > 0 && (
                          <span className="text-red-600 ml-1">(-{calc.discountedDays})</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Salario Base</span>
                      <span className="font-medium">${calc.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Salario Bruto</span>
                      <span className="font-medium">${calc.grossSalary.toLocaleString()}</span>
                    </div>
                    
                    {calc.transportAllowance > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Auxilio Transporte</span>
                        <span className="font-medium text-green-600">${calc.transportAllowance.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Novedades Adicionadas */}
                    {calc.novelties.filter(n => 
                      ['FIXED_COMPENSATION', 'SALES_BONUS', 'FIXED_OVERTIME', 'UNEXPECTED_OVERTIME', 'NIGHT_SURCHARGE', 'SUNDAY_WORK', 'GAS_ALLOWANCE'].includes(n.type)
                    ).length > 0 && (
                      <div className="border-t border-green-300 pt-2 mt-2">
                        <h5 className="text-sm font-medium text-green-800 mb-2">Novedades Adicionadas:</h5>
                        {calc.bonusCalculations.fixedCompensation > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">Compensatorios fijos</span>
                            <span className="text-green-600 font-medium">${calc.bonusCalculations.fixedCompensation.toLocaleString()}</span>
                          </div>
                        )}
                        {calc.bonusCalculations.salesBonus > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">Bonificación en venta</span>
                            <span className="text-green-600 font-medium">${calc.bonusCalculations.salesBonus.toLocaleString()}</span>
                          </div>
                        )}
                        {calc.bonusCalculations.fixedOvertime > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              Horas extra fijas {(() => {
                                const hoursNovelty = calc.novelties.find(n => n.type === 'FIXED_OVERTIME');
                                return hoursNovelty?.hours ? `(${hoursNovelty.hours} ${hoursNovelty.hours === 1 ? 'hora' : 'horas'})` : '';
                              })()}
                            </span>
                            <span className="text-green-600 font-medium">${calc.bonusCalculations.fixedOvertime.toLocaleString()}</span>
                          </div>
                        )}
                        {calc.bonusCalculations.unexpectedOvertime > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              Horas extra NE {(() => {
                                const hoursNovelty = calc.novelties.find(n => n.type === 'UNEXPECTED_OVERTIME');
                                return hoursNovelty?.hours ? `(${hoursNovelty.hours} ${hoursNovelty.hours === 1 ? 'hora' : 'horas'})` : '';
                              })()}
                            </span>
                            <span className="text-green-600 font-medium">${calc.bonusCalculations.unexpectedOvertime.toLocaleString()}</span>
                          </div>
                        )}
                        {calc.bonusCalculations.nightSurcharge > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              Recargos nocturnos {(() => {
                                const hoursNovelty = calc.novelties.find(n => n.type === 'NIGHT_SURCHARGE');
                                return hoursNovelty?.hours ? `(${hoursNovelty.hours} ${hoursNovelty.hours === 1 ? 'hora' : 'horas'})` : '';
                              })()}
                            </span>
                            <span className="text-green-600 font-medium">${calc.bonusCalculations.nightSurcharge.toLocaleString()}</span>
                          </div>
                        )}
                        {calc.bonusCalculations.sundayWork > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              Festivos {(() => {
                                const daysNovelty = calc.novelties.find(n => n.type === 'SUNDAY_WORK');
                                return daysNovelty?.days ? `(${daysNovelty.days} ${daysNovelty.days === 1 ? 'día' : 'días'})` : '';
                              })()}
                            </span>
                            <span className="text-green-600 font-medium">${calc.bonusCalculations.sundayWork.toLocaleString()}</span>
                          </div>
                        )}
                        {calc.bonusCalculations.gasAllowance > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">Auxilio de gasolina</span>
                            <span className="text-green-600 font-medium">${calc.bonusCalculations.gasAllowance.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="border-t border-green-300 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-800">Total Devengado</span>
                        <span className="font-bold text-green-700 text-lg">${(calc.totalEarned || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deducciones Section */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-red-800 mb-3 text-center">DEDUCCIONES</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">Salud</span>
                      <span className="text-red-600 font-medium">-${calc.deductions.health.toLocaleString()}</span>
                    </div>
                    
                    {!calc.employee.isPensioned && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Pensión</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.pension.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {calc.deductions.solidarity > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Solidaridad</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.solidarity.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {calc.deductions.absence > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Ausencias</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.absence.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {calc.deductions.planCorporativo > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Plan Corp.</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.planCorporativo.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {calc.deductions.recordar > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Recordar</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.recordar.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {calc.deductions.inventariosCruces > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Inventario</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.inventariosCruces.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {calc.deductions.multas > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Multas</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.multas.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {calc.deductions.fondoEmpleados > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">FondoEMP</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.fondoEmpleados.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {calc.deductions.carteraEmpleados > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">CarteraEMP</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.carteraEmpleados.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {calc.deductions.advance > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Anticipo Quincena (valor original)</span>
                        <span className="text-red-600 font-medium">-${calc.deductions.advance.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-red-300 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-red-800">Total Deducciones</span>
                        <span className="font-bold text-red-700 text-lg">-${calc.deductions.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Salario Neto */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-800 text-lg">SALARIO NETO</span>
                    <span className="font-bold text-blue-700 text-2xl">${calc.netSalary.toLocaleString()}</span>
                  </div>
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
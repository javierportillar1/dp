import React, { useState } from 'react';
import { Settings, Percent, Save, RotateCcw, Clock, DollarSign } from 'lucide-react';
import { DeductionRates, DEFAULT_DEDUCTION_RATES } from '../types';

interface SettingsManagementProps {
  deductionRates: DeductionRates;
  setDeductionRates: (rates: DeductionRates) => void;
}

export const SettingsManagement: React.FC<SettingsManagementProps> = ({ 
  deductionRates, 
  setDeductionRates 
}) => {
  const [formData, setFormData] = useState({
    health: deductionRates.health.toString(),
    pension: deductionRates.pension.toString(),
    solidarity: deductionRates.solidarity.toString(),
    transportAllowance: deductionRates.transportAllowance.toString(),
    sunday1: deductionRates.sunday1.toString(),
    sunday2: deductionRates.sunday2.toString(),
    sunday3: deductionRates.sunday3.toString(),
    overtime: deductionRates.overtime.toString(),
    nightSellers: deductionRates.nightSellers.toString(),
    nightSurcharge: deductionRates.nightSurcharge.toString(),
    ordinaryHour: deductionRates.ordinaryHour.toString(),
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRates: DeductionRates = {
      health: parseFloat(formData.health),
      pension: parseFloat(formData.pension),
      solidarity: parseFloat(formData.solidarity),
      transportAllowance: parseFloat(formData.transportAllowance),
      sunday1: parseFloat(formData.sunday1),
      sunday2: parseFloat(formData.sunday2),
      sunday3: parseFloat(formData.sunday3),
      overtime: parseFloat(formData.overtime),
      nightSellers: parseFloat(formData.nightSellers),
      nightSurcharge: parseFloat(formData.nightSurcharge),
      ordinaryHour: parseFloat(formData.ordinaryHour),
    };

    setDeductionRates(newRates);
    setIsSaved(true);
    
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    setFormData({
      health: DEFAULT_DEDUCTION_RATES.health.toString(),
      pension: DEFAULT_DEDUCTION_RATES.pension.toString(),
      solidarity: DEFAULT_DEDUCTION_RATES.solidarity.toString(),
      transportAllowance: DEFAULT_DEDUCTION_RATES.transportAllowance.toString(),
      sunday1: DEFAULT_DEDUCTION_RATES.sunday1.toString(),
      sunday2: DEFAULT_DEDUCTION_RATES.sunday2.toString(),
      sunday3: DEFAULT_DEDUCTION_RATES.sunday3.toString(),
      overtime: DEFAULT_DEDUCTION_RATES.overtime.toString(),
      nightSellers: DEFAULT_DEDUCTION_RATES.nightSellers.toString(),
      nightSurcharge: DEFAULT_DEDUCTION_RATES.nightSurcharge.toString(),
      ordinaryHour: DEFAULT_DEDUCTION_RATES.ordinaryHour.toString(),
    });
    setDeductionRates(DEFAULT_DEDUCTION_RATES);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Settings className="h-4 w-4" />
          <span>Configuración de Parámetros</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deduction Percentages */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Percent className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Porcentajes de Deducciones</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-red-700 mb-2">
                Deducción de Salud
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.health}
                  onChange={(e) => setFormData({ ...formData, health: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-red-600 text-sm">%</span>
              </div>
              <p className="text-xs text-red-600 mt-1">Porcentaje aplicado sobre el salario bruto</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Deducción de Pensión
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.pension}
                  onChange={(e) => setFormData({ ...formData, pension: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-blue-600 text-sm">%</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Porcentaje aplicado sobre el salario bruto</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Fondo de Solidaridad
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.solidarity}
                  onChange={(e) => setFormData({ ...formData, solidarity: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-purple-600 text-sm">%</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">Solo para salarios ≥ 4 salarios mínimos</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-green-700 mb-2">
                Auxilio de Transporte
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.transportAllowance}
                  onChange={(e) => setFormData({ ...formData, transportAllowance: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-green-600 text-sm">$</span>
              </div>
              <p className="text-xs text-green-600 mt-1">Solo para salarios menor a 2 salarios mínimos y contratos NOMINA</p>
            </div>
          </div>
        </div>

        {/* Hour and Day Rates */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Tarifas por Horas y Días</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-indigo-700 mb-2">
                Dominical 1
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.sunday1}
                  onChange={(e) => setFormData({ ...formData, sunday1: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-indigo-600 text-sm">$</span>
              </div>
              <p className="text-xs text-indigo-600 mt-1">Valor por día dominical tipo 1</p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-indigo-700 mb-2">
                Dominical 2
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.sunday2}
                  onChange={(e) => setFormData({ ...formData, sunday2: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-indigo-600 text-sm">$</span>
              </div>
              <p className="text-xs text-indigo-600 mt-1">Valor por día dominical tipo 2</p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-indigo-700 mb-2">
                Dominical 3
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.sunday3}
                  onChange={(e) => setFormData({ ...formData, sunday3: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-indigo-600 text-sm">$</span>
              </div>
              <p className="text-xs text-indigo-600 mt-1">Valor por día dominical tipo 3</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-orange-700 mb-2">
                Horas Extra
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.overtime}
                  onChange={(e) => setFormData({ ...formData, overtime: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-orange-600 text-sm">$</span>
              </div>
              <p className="text-xs text-orange-600 mt-1">Valor por hora extra</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nocturnos Vendedores
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.nightSellers}
                  onChange={(e) => setFormData({ ...formData, nightSellers: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-slate-600 text-sm">$</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">Valor por hora nocturna vendedores</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recargos Nocturnos
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.nightSurcharge}
                  onChange={(e) => setFormData({ ...formData, nightSurcharge: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-gray-600 text-sm">$</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Valor por hora de recargo nocturno</p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Hora Ordinaria
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.ordinaryHour}
                  onChange={(e) => setFormData({ ...formData, ordinaryHour: e.target.value })}
                  className="w-full px-3 py-2 pr-8 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-3 top-2 text-emerald-600 text-sm">$</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">Valor por hora ordinaria</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Información Importante</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Los porcentajes se aplican sobre el salario bruto (después de descontar días no trabajados)</li>
            <li>• El fondo de solidaridad solo aplica para empleados con salarios ≥ 4 salarios mínimos</li>
            <li>• El auxilio de transporte solo aplica para empleados con salarios menor a 2 salarios mínimos y contratos NÓMINA</li>
            <li>• Las tarifas por horas y días se utilizan para calcular bonificaciones y recargos</li>
            <li>• Los cambios afectarán todos los cálculos futuros de nómina</li>
            <li>• Se recomienda verificar con la normativa laboral vigente</li>
          </ul>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restaurar Valores por Defecto</span>
          </button>

          <div className="flex items-center space-x-3">
            {isSaved && (
              <span className="text-green-600 text-sm font-medium">
                ✓ Configuración guardada
              </span>
            )}
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </form>

      {/* Current Configuration Display */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración Actual</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Deducciones (%)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{deductionRates.health}%</p>
                <p className="text-sm text-gray-600">Salud</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{deductionRates.pension}%</p>
                <p className="text-sm text-gray-600">Pensión</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{deductionRates.solidarity}%</p>
                <p className="text-sm text-gray-600">Solidaridad</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">${deductionRates.transportAllowance.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Aux. Transporte</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Tarifas ($)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-indigo-600">${deductionRates.sunday1.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Dominical 1</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-indigo-600">${deductionRates.sunday2.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Dominical 2</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-indigo-600">${deductionRates.sunday3.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Dominical 3</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-orange-600">${deductionRates.overtime.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Horas Extra</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-slate-600">${deductionRates.nightSellers.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Nocturnos Vendedores</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-600">${deductionRates.nightSurcharge.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Recargos Nocturnos</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-emerald-600">${deductionRates.ordinaryHour.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Hora Ordinaria</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Plus, CreditCard, User, Calendar, DollarSign, Trash2, Edit, Save, X } from 'lucide-react';
import { Employee, AdvancePayment } from '../types';
import { formatMonthYear } from '../utils/dateUtils';

interface AdvanceManagementProps {
  employees: Employee[];
  advances: AdvancePayment[];
  setAdvances: (advances: AdvancePayment[]) => void;
}

interface BulkAdvanceData {
  [employeeId: string]: {
    amount: string;
    description: string;
  };
}

export const AdvanceManagement: React.FC<AdvanceManagementProps> = ({ 
  employees, 
  advances, 
  setAdvances 
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bulkAdvanceData, setBulkAdvanceData] = useState<BulkAdvanceData>({});
  const [editingEmployees, setEditingEmployees] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    month: new Date().toISOString().slice(0, 7),
    description: '',
  });

  // Get employees with and without advances for selected month
  const employeesWithAdvances = advances
    .filter(advance => advance.month === selectedMonth)
    .map(advance => advance.employeeId);
  
  const employeesWithoutAdvances = employees
    .filter(emp => !employeesWithAdvances.includes(emp.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const employeesWithAdvancesData = employees
    .filter(emp => employeesWithAdvances.includes(emp.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return;

    const newAdvance: AdvancePayment = {
      id: crypto.randomUUID(),
      employeeId: formData.employeeId,
      employeeName: employee.name,
      amount: parseFloat(formData.amount),
      date: formData.date,
      month: formData.month,
      description: formData.description,
    };

    setAdvances([...advances, newAdvance]);

    setFormData({
      employeeId: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      month: new Date().toISOString().slice(0, 7),
      description: '',
    });
    setIsFormOpen(false);
  };

  const handleDelete = (advanceId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este adelanto?')) {
      setAdvances(advances.filter(a => a.id !== advanceId));
    }
  };

  const handleBulkAdvanceChange = (employeeId: string, field: 'amount' | 'description', value: string) => {
    setBulkAdvanceData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  const handleEditEmployee = (employeeId: string) => {
    setEditingEmployees(prev => new Set([...prev, employeeId]));
  };

  const handleCancelEdit = (employeeId: string) => {
    setEditingEmployees(prev => {
      const newSet = new Set(prev);
      newSet.delete(employeeId);
      return newSet;
    });
    setBulkAdvanceData(prev => {
      const newData = { ...prev };
      delete newData[employeeId];
      return newData;
    });
  };

  const handleSaveBulkAdvances = () => {
    const newAdvances: AdvancePayment[] = [];
    
    Object.entries(bulkAdvanceData).forEach(([employeeId, data]) => {
      if (data.amount && parseFloat(data.amount) > 0) {
        const employee = employees.find(emp => emp.id === employeeId);
        if (employee) {
          newAdvances.push({
            id: crypto.randomUUID(),
            employeeId,
            employeeName: employee.name,
            amount: parseFloat(data.amount),
            date: new Date().toISOString().slice(0, 10),
            month: selectedMonth,
            description: data.description || '',
          });
        }
      }
    });

    if (newAdvances.length > 0) {
      setAdvances([...advances, ...newAdvances]);
      setBulkAdvanceData({});
      setEditingEmployees(new Set());
    }
  };

  const totalAdvances = advances
    .filter(advance => advance.month === selectedMonth)
    .reduce((sum, advance) => sum + advance.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Adelantos</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Adelanto Individual</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <CreditCard className="h-6 w-6" />
          <span className="text-lg font-medium">Total Adelantos - {formatMonthYear(selectedMonth)}</span>
        </div>
        <p className="text-3xl font-bold">${totalAdvances.toLocaleString()}</p>
        <p className="text-purple-100 text-sm">
          {employeesWithAdvances.length} empleados con adelantos
        </p>
      </div>

      {/* Employees without advances */}
      {employeesWithoutAdvances.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-900">
                Empleados sin Adelantos - {formatMonthYear(selectedMonth)}
              </h3>
              {Object.keys(bulkAdvanceData).length > 0 && (
                <button
                  onClick={handleSaveBulkAdvances}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Adelantos</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {employeesWithoutAdvances.map((employee) => (
              <div key={employee.id} className="px-6 py-4 bg-blue-25 hover:bg-blue-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-900">{employee.name}</span>
                      <p className="text-sm text-gray-500">{employee.contractType}</p>
                    </div>
                  </div>
                  
                  {editingEmployees.has(employee.id) ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          placeholder="Monto"
                          value={bulkAdvanceData[employee.id]?.amount || ''}
                          onChange={(e) => handleBulkAdvanceChange(employee.id, 'amount', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Descripción (opcional)"
                        value={bulkAdvanceData[employee.id]?.description || ''}
                        onChange={(e) => handleBulkAdvanceChange(employee.id, 'description', e.target.value)}
                        className="w-40 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleCancelEdit(employee.id)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditEmployee(employee.id)}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Agregar Adelanto</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees with advances */}
      {employeesWithAdvancesData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <h3 className="text-lg font-semibold text-green-900">
              Empleados con Adelantos Registrados - {formatMonthYear(selectedMonth)}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {advances
                  .filter(advance => advance.month === selectedMonth)
                  .sort((a, b) => a.employeeName.localeCompare(b.employeeName))
                  .map((advance) => (
                    <tr key={advance.id} className="bg-green-25 hover:bg-green-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {advance.employeeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm font-medium text-green-600">
                            ${advance.amount.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {new Date(advance.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {advance.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(advance.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual advance form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Registrar Adelanto Individual</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empleado
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto del Adelanto
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha del Adelanto
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mes de Nómina a Descontar
                </label>
                <input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Motivo del adelanto (opcional)"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {employeesWithoutAdvances.length === 0 && employeesWithAdvancesData.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados registrados</h3>
          <p className="mt-1 text-sm text-gray-500">
            Primero registra empleados para poder gestionar adelantos.
          </p>
        </div>
      )}
    </div>
  );
};

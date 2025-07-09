import React, { useState } from 'react';
import { Plus, Calendar, User, AlertCircle, Edit, Save, X, Gift, Fuel, Clock } from 'lucide-react';
import { Employee, Novelty } from '../types';
import { formatMonthYear } from '../utils/dateUtils';

interface NoveltyManagementProps {
  employees: Employee[];
  novelties: Novelty[];
  setNovelties: (novelties: Novelty[]) => void;
  setEmployees: (employees: Employee[]) => void;
}

interface BulkNoveltyData {
  [employeeId: string]: {
    type: Novelty['type'];
    discountDays: string;
    bonusAmount: string;
    description: string;
  };
}

export const NoveltyManagement: React.FC<NoveltyManagementProps> = ({ 
  employees, 
  novelties, 
  setNovelties, 
  setEmployees 
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bulkNoveltyData, setBulkNoveltyData] = useState<BulkNoveltyData>({});
  const [editingEmployees, setEditingEmployees] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'ABSENCE' as Novelty['type'],
    date: '',
    description: '',
    discountDays: '1',
    bonusAmount: '0',
  });

  const noveltyTypes = [
    { value: 'ABSENCE', label: 'Ausencia', icon: AlertCircle, color: 'red', isDeduction: true },
    { value: 'LATE', label: 'Llegada tarde', icon: Clock, color: 'yellow', isDeduction: true },
    { value: 'EARLY_LEAVE', label: 'Salida temprana', icon: Clock, color: 'orange', isDeduction: true },
    { value: 'MEDICAL_LEAVE', label: 'Incapacidad médica', icon: AlertCircle, color: 'blue', isDeduction: true },
    { value: 'VACATION', label: 'Vacaciones', icon: Calendar, color: 'green', isDeduction: true },
    { value: 'BONUS', label: 'Bonificación', icon: Gift, color: 'purple', isDeduction: false },
    { value: 'GAS_ALLOWANCE', label: 'Auxilio de gasolina', icon: Fuel, color: 'indigo', isDeduction: false },
    { value: 'OVERTIME', label: 'Horas extra', icon: Clock, color: 'emerald', isDeduction: false },
  ];

  // Get employees with and without novelties for selected month
  const employeesWithNovelties = novelties
    .filter(novelty => novelty.date.startsWith(selectedMonth))
    .map(novelty => novelty.employeeId);
  
  const employeesWithoutNovelties = employees
    .filter(emp => !employeesWithNovelties.includes(emp.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const employeesWithNoveltiesData = employees
    .filter(emp => employeesWithNovelties.includes(emp.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return;

    const noveltyType = noveltyTypes.find(t => t.value === formData.type);
    const isDeduction = noveltyType?.isDeduction || false;

    const newNovelty: Novelty = {
      id: crypto.randomUUID(),
      employeeId: formData.employeeId,
      employeeName: employee.name,
      type: formData.type,
      date: formData.date,
      description: formData.description,
      discountDays: isDeduction ? parseFloat(formData.discountDays) : 0,
      bonusAmount: !isDeduction ? parseFloat(formData.bonusAmount) : 0,
    };

    setNovelties([...novelties, newNovelty]);

    // Note: We no longer update employee's total worked days here
    // The monthly calculation will handle absences per month

    setFormData({
      employeeId: '',
      type: 'ABSENCE',
      date: '',
      description: '',
      discountDays: '1',
      bonusAmount: '0',
    });
    setIsFormOpen(false);
  };

  const handleDelete = (noveltyId: string) => {
    const novelty = novelties.find(n => n.id === noveltyId);
    if (!novelty) return;

    if (confirm('¿Estás seguro de que quieres eliminar esta novedad?')) {
      setNovelties(novelties.filter(n => n.id !== noveltyId));
      
      // Note: We no longer update employee's total worked days here
      // The monthly calculation will handle absences per month
    }
  };

  const handleBulkNoveltyChange = (employeeId: string, field: keyof BulkNoveltyData[string], value: string) => {
    setBulkNoveltyData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  const handleEditEmployee = (employeeId: string) => {
    setEditingEmployees(prev => new Set([...prev, employeeId]));
    setBulkNoveltyData(prev => ({
      ...prev,
      [employeeId]: {
        type: 'ABSENCE',
        discountDays: '1',
        bonusAmount: '0',
        description: ''
      }
    }));
  };

  const handleCancelEdit = (employeeId: string) => {
    setEditingEmployees(prev => {
      const newSet = new Set(prev);
      newSet.delete(employeeId);
      return newSet;
    });
    setBulkNoveltyData(prev => {
      const newData = { ...prev };
      delete newData[employeeId];
      return newData;
    });
  };

  const handleSaveBulkNovelties = () => {
    const newNovelties: Novelty[] = [];
    const employeeUpdates: { [id: string]: number } = {};
    
    Object.entries(bulkNoveltyData).forEach(([employeeId, data]) => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee && data.type) {
        const noveltyType = noveltyTypes.find(t => t.value === data.type);
        const isDeduction = noveltyType?.isDeduction || false;
        
        const discountDays = isDeduction ? parseFloat(data.discountDays) || 0 : 0;
        const bonusAmount = !isDeduction ? parseFloat(data.bonusAmount) || 0 : 0;
        
        if (discountDays > 0 || bonusAmount > 0) {
          newNovelties.push({
            id: crypto.randomUUID(),
            employeeId,
            employeeName: employee.name,
            type: data.type,
            date: new Date().toISOString().slice(0, 10),
            description: data.description || '',
            discountDays,
            bonusAmount,
          });

          // Track employee updates for deductions
          if (isDeduction && discountDays > 0) {
            employeeUpdates[employeeId] = (employeeUpdates[employeeId] || 0) + discountDays;
          }
        }
      }
    });

    if (newNovelties.length > 0) {
      setNovelties([...novelties, ...newNovelties]);
      
      // Note: We no longer update employee's total worked days here
      // The monthly calculation will handle absences per month
      
      setBulkNoveltyData({});
      setEditingEmployees(new Set());
    }
  };

  const getNoveltyTypeInfo = (type: Novelty['type']) => {
    return noveltyTypes.find(t => t.value === type) || noveltyTypes[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Novedades</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Novedad Individual</span>
          </button>
        </div>
      </div>

      {/* Employees without novelties */}
      {employeesWithoutNovelties.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-900">
                Empleados sin Novedades - {formatMonthYear(selectedMonth)}
              </h3>
              {Object.keys(bulkNoveltyData).length > 0 && (
                <button
                  onClick={handleSaveBulkNovelties}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Novedades</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {employeesWithoutNovelties.map((employee) => (
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
                      <select
                        value={bulkNoveltyData[employee.id]?.type || 'ABSENCE'}
                        onChange={(e) => handleBulkNoveltyChange(employee.id, 'type', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {noveltyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      
                      {getNoveltyTypeInfo(bulkNoveltyData[employee.id]?.type || 'ABSENCE').isDeduction ? (
                        <input
                          type="number"
                          step="0.5"
                          placeholder="Días"
                          value={bulkNoveltyData[employee.id]?.discountDays || ''}
                          onChange={(e) => handleBulkNoveltyChange(employee.id, 'discountDays', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="number"
                          placeholder="Monto"
                          value={bulkNoveltyData[employee.id]?.bonusAmount || ''}
                          onChange={(e) => handleBulkNoveltyChange(employee.id, 'bonusAmount', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                      
                      <input
                        type="text"
                        placeholder="Descripción"
                        value={bulkNoveltyData[employee.id]?.description || ''}
                        onChange={(e) => handleBulkNoveltyChange(employee.id, 'description', e.target.value)}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <span>Agregar Novedad</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees with novelties */}
      {employeesWithNoveltiesData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
            <h3 className="text-lg font-semibold text-green-900">
              Empleados con Novedades Registradas - {formatMonthYear(selectedMonth)}
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
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
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
                {novelties
                  .filter(novelty => novelty.date.startsWith(selectedMonth))
                  .sort((a, b) => a.employeeName.localeCompare(b.employeeName))
                  .map((novelty) => {
                    const typeInfo = getNoveltyTypeInfo(novelty.type);
                    const Icon = typeInfo.icon;
                    return (
                      <tr key={novelty.id} className="bg-green-25 hover:bg-green-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {novelty.employeeName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {new Date(novelty.date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {typeInfo.isDeduction ? (
                            <span className="text-sm text-red-600 font-medium">
                              -{novelty.discountDays} días
                            </span>
                          ) : (
                            <span className="text-sm text-green-600 font-medium">
                              +${novelty.bonusAmount.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {novelty.description || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(novelty.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual novelty form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Registrar Novedad Individual</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empleado
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  Tipo de Novedad
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Novelty['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {noveltyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              
              {getNoveltyTypeInfo(formData.type).isDeduction ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Días a descontar
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.discountDays}
                    onChange={(e) => setFormData({ ...formData, discountDays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto del bono
                  </label>
                  <input
                    type="number"
                    value={formData.bonusAmount}
                    onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Descripción opcional de la novedad"
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
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {employeesWithoutNovelties.length === 0 && employeesWithNoveltiesData.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados registrados</h3>
          <p className="mt-1 text-sm text-gray-500">
            Primero registra empleados para poder gestionar novedades.
          </p>
        </div>
      )}
    </div>
  );
};

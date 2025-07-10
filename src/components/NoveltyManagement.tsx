import React, { useState } from 'react';
import { Plus, Calendar, User, AlertTriangle, Heart, Plane, Gift, Clock, DollarSign, Save, X, Trash2, Check } from 'lucide-react';
import { Employee, Novelty } from '../types';
import { formatMonthYear } from '../utils/dateUtils';

interface NoveltyManagementProps {
  employees: Employee[];
  novelties: Novelty[];
  setNovelties: (novelties: Novelty[]) => void;
  setEmployees: (employees: Employee[]) => void;
}

interface PendingNovelty {
  id: string;
  employeeId: string;
  type: Novelty['type'];
  value: string;
  description: string;
  categoryColor: string;
  categoryIcon: any;
  typeLabel: string;
  unitType: 'DAYS' | 'MONEY' | 'HOURS';
}

interface BulkNoveltyData {
  [employeeId: string]: {
    type: Novelty['type'];
    value: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [pendingNovelties, setPendingNovelties] = useState<PendingNovelty[]>([]);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'ABSENCE' as Novelty['type'],
    date: '',
    description: '',
    value: '1',
  });

  const noveltyCategories = [
    {
      id: 'disciplinary',
      name: 'Disciplinarias',
      icon: AlertTriangle,
      color: 'red',
      types: [
        { value: 'ABSENCE', label: 'Ausencia', unitType: 'DAYS' as const },
        { value: 'LATE', label: 'Llegada tarde', unitType: 'HOURS' as const },
        { value: 'EARLY_LEAVE', label: 'Salida temprana', unitType: 'HOURS' as const },
      ]
    },
    {
      id: 'health',
      name: 'Salud',
      icon: Heart,
      color: 'blue',
      types: [
        { value: 'MEDICAL_LEAVE', label: 'Incapacidad médica', unitType: 'DAYS' as const },
      ]
    },
    {
      id: 'vacation',
      name: 'Vacaciones',
      icon: Plane,
      color: 'green',
      types: [
        { value: 'VACATION', label: 'Vacaciones', unitType: 'DAYS' as const },
      ]
    },
    {
      id: 'bonuses',
      name: 'Bonificaciones',
      icon: Gift,
      color: 'purple',
      types: [
        { value: 'FIXED_COMPENSATION', label: 'Compensatorios fijos', unitType: 'MONEY' as const },
        { value: 'SALES_BONUS', label: 'Bonificación en venta', unitType: 'MONEY' as const },
        { value: 'FIXED_OVERTIME', label: 'Horas extra fijas', unitType: 'HOURS' as const },
        { value: 'UNEXPECTED_OVERTIME', label: 'Horas extra NE', unitType: 'HOURS' as const },
        { value: 'NIGHT_SURCHARGE', label: 'Recargos nocturnos', unitType: 'HOURS' as const },
        { value: 'SUNDAY_WORK', label: 'Festivos', unitType: 'DAYS' as const },
        { value: 'GAS_ALLOWANCE', label: 'Auxilio de gasolina', unitType: 'MONEY' as const },
      ]
    }
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

  const getNoveltyTypeInfo = (type: Novelty['type']) => {
    for (const category of noveltyCategories) {
      const noveltyType = category.types.find(t => t.value === type);
      if (noveltyType) {
        return { 
          ...noveltyType, 
          categoryColor: category.color, 
          categoryIcon: category.icon 
        };
      }
    }
    return { 
      ...noveltyCategories[0].types[0], 
      categoryColor: noveltyCategories[0].color, 
      categoryIcon: noveltyCategories[0].icon 
    };
  };

  const getUnitLabel = (unitType: 'DAYS' | 'MONEY' | 'HOURS') => {
    switch (unitType) {
      case 'DAYS': return 'días';
      case 'MONEY': return 'pesos';
      case 'HOURS': return 'horas';
      default: return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return;

    const typeInfo = getNoveltyTypeInfo(formData.type);
    const value = parseFloat(formData.value);

    const newNovelty: Novelty = {
      id: crypto.randomUUID(),
      employeeId: formData.employeeId,
      employeeName: employee.name,
      type: formData.type,
      date: formData.date,
      description: formData.description,
      discountDays: typeInfo.unitType === 'DAYS' && ['ABSENCE', 'LATE', 'EARLY_LEAVE', 'MEDICAL_LEAVE', 'VACATION'].includes(formData.type) ? value : 0,
      bonusAmount: typeInfo.unitType === 'MONEY' ? value : 0,
      hours: typeInfo.unitType === 'HOURS' ? value : undefined,
      days: typeInfo.unitType === 'DAYS' && !['ABSENCE', 'LATE', 'EARLY_LEAVE', 'MEDICAL_LEAVE', 'VACATION'].includes(formData.type) ? value : undefined,
      unitType: typeInfo.unitType,
    };

    setNovelties([...novelties, newNovelty]);

    setFormData({
      employeeId: '',
      type: 'ABSENCE',
      date: '',
      description: '',
      value: '1',
    });
    setIsFormOpen(false);
  };

  const handleDelete = (noveltyId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta novedad?')) {
      setNovelties(novelties.filter(n => n.id !== noveltyId));
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

  const handleEditEmployee = (employeeId: string, categoryId: string) => {
    setEditingEmployees(prev => new Set([...prev, employeeId]));
    setSelectedCategory(categoryId);
    const category = noveltyCategories.find(c => c.id === categoryId);
    setBulkNoveltyData(prev => ({
      ...prev,
      [employeeId]: {
        type: (category?.types[0].value || 'ABSENCE') as Novelty['type'],
        value: '1',
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
    setSelectedCategory('');
  };

  // Confirmar una novedad individual (agregar a pendientes)
  const handleConfirmNovelty = (employeeId: string) => {
    const data = bulkNoveltyData[employeeId];
    if (!data || !data.type || !data.value || parseFloat(data.value) <= 0) return;

    const typeInfo = getNoveltyTypeInfo(data.type);
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const pendingNovelty: PendingNovelty = {
      id: crypto.randomUUID(),
      employeeId,
      type: data.type,
      value: data.value,
      description: data.description,
      categoryColor: typeInfo.categoryColor,
      categoryIcon: typeInfo.categoryIcon,
      typeLabel: typeInfo.label,
      unitType: typeInfo.unitType,
    };

    setPendingNovelties(prev => [...prev, pendingNovelty]);

    // Limpiar el formulario pero mantener el empleado en modo edición
    setBulkNoveltyData(prev => ({
      ...prev,
      [employeeId]: {
        type: data.type, // Mantener el mismo tipo
        value: '1',
        description: ''
      }
    }));
  };

  // Eliminar una novedad pendiente
  const handleRemovePendingNovelty = (pendingId: string) => {
    setPendingNovelties(prev => prev.filter(p => p.id !== pendingId));
  };

  // Guardar todas las novedades pendientes
  const handleSaveAllNovelties = () => {
    if (pendingNovelties.length === 0) return;

    const newNovelties: Novelty[] = pendingNovelties.map(pending => {
      const employee = employees.find(emp => emp.id === pending.employeeId);
      const value = parseFloat(pending.value);
      
      return {
        id: crypto.randomUUID(),
        employeeId: pending.employeeId,
        employeeName: employee?.name || '',
        type: pending.type,
        date: new Date().toISOString().slice(0, 10),
        description: pending.description || '',
        discountDays: pending.unitType === 'DAYS' && ['ABSENCE', 'LATE', 'EARLY_LEAVE', 'MEDICAL_LEAVE', 'VACATION'].includes(pending.type) ? value : 0,
        bonusAmount: pending.unitType === 'MONEY' ? value : 0,
        hours: pending.unitType === 'HOURS' ? value : undefined,
        days: pending.unitType === 'DAYS' && !['ABSENCE', 'LATE', 'EARLY_LEAVE', 'MEDICAL_LEAVE', 'VACATION'].includes(pending.type) ? value : undefined,
        unitType: pending.unitType,
      };
    });

    setNovelties([...novelties, ...newNovelties]);
    setPendingNovelties([]);
    setBulkNoveltyData({});
    setEditingEmployees(new Set());
    setSelectedCategory('');
  };

  const getNoveltyDisplayValue = (novelty: Novelty) => {
    switch (novelty.unitType) {
      case 'DAYS':
        if (['ABSENCE', 'LATE', 'EARLY_LEAVE', 'MEDICAL_LEAVE', 'VACATION'].includes(novelty.type)) {
          return `${novelty.discountDays} días`;
        }
        return `${novelty.days} días`;
      case 'MONEY':
        return `$${novelty.bonusAmount.toLocaleString()}`;
      case 'HOURS':
        return `${novelty.hours} horas`;
      default:
        return '-';
    }
  };

  const getPendingDisplayValue = (pending: PendingNovelty) => {
    const value = parseFloat(pending.value);
    switch (pending.unitType) {
      case 'DAYS':
        return `${value} días`;
      case 'MONEY':
        return `$${value.toLocaleString()}`;
      case 'HOURS':
        return `${value} horas`;
      default:
        return '-';
    }
  };

  // Get available types for the selected category
  const getAvailableTypes = () => {
    if (!selectedCategory) return [];
    const category = noveltyCategories.find(c => c.id === selectedCategory);
    return category?.types || [];
  };

  const colorClasses = {
    red: 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800',
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800',
    green: 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800',
    purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800'
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

      {/* Pending Novelties Section */}
      {pendingNovelties.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-yellow-800">
              Novedades Pendientes de Guardar ({pendingNovelties.length})
            </h3>
            <button
              onClick={handleSaveAllNovelties}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Todas las Novedades</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingNovelties.map((pending) => {
              const employee = employees.find(emp => emp.id === pending.employeeId);
              const Icon = pending.categoryIcon;
              
              return (
                <div key={pending.id} className="bg-white border border-yellow-300 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{employee?.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemovePendingNovelty(pending.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Tipo:</span> {pending.typeLabel}</p>
                    <p><span className="font-medium">Valor:</span> {getPendingDisplayValue(pending)}</p>
                    {pending.description && (
                      <p><span className="font-medium">Descripción:</span> {pending.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employees without novelties */}
      {employeesWithoutNovelties.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900">
              Empleados sin Novedades - {formatMonthYear(selectedMonth)}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {employeesWithoutNovelties.map((employee) => (
              <div key={employee.id} className="px-6 py-4 hover:bg-blue-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-900">{employee.name}</span>
                      <p className="text-sm text-gray-500">{employee.contractType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Mostrar novedades pendientes para este empleado */}
                    {pendingNovelties.filter(p => p.employeeId === employee.id).length > 0 && (
                      <div className="text-xs text-green-600 font-medium">
                        {pendingNovelties.filter(p => p.employeeId === employee.id).length} pendiente(s)
                      </div>
                    )}
                    
                    {editingEmployees.has(employee.id) ? (
                      <div className="flex items-center space-x-3">
                        <select
                          value={bulkNoveltyData[employee.id]?.type || ''}
                          onChange={(e) => handleBulkNoveltyChange(employee.id, 'type', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccionar tipo</option>
                          {getAvailableTypes().map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            placeholder="Valor"
                            value={bulkNoveltyData[employee.id]?.value || ''}
                            onChange={(e) => handleBulkNoveltyChange(employee.id, 'value', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-xs text-gray-500">
                            {(() => {
                              const selectedType = bulkNoveltyData[employee.id]?.type;
                              if (selectedType) {
                                const typeInfo = getNoveltyTypeInfo(selectedType);
                                return getUnitLabel(typeInfo.unitType);
                              }
                              return '';
                            })()}
                          </span>
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Descripción"
                          value={bulkNoveltyData[employee.id]?.description || ''}
                          onChange={(e) => handleBulkNoveltyChange(employee.id, 'description', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        <button
                          onClick={() => handleConfirmNovelty(employee.id)}
                          disabled={!bulkNoveltyData[employee.id]?.type || !bulkNoveltyData[employee.id]?.value || parseFloat(bulkNoveltyData[employee.id]?.value || '0') <= 0}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors"
                        >
                          <Check className="h-3 w-3" />
                          <span>Listo</span>
                        </button>
                        
                        <button
                          onClick={() => handleCancelEdit(employee.id)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                    
                    {/* Siempre mostrar los botones de categorías */}
                    <div className="flex items-center space-x-2">
                      {noveltyCategories.map((category) => {
                        const Icon = category.icon;
                        
                        return (
                          <button
                            key={category.id}
                            onClick={() => handleEditEmployee(employee.id, category.id)}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-md ${colorClasses[category.color as keyof typeof colorClasses]}`}
                            title={category.name}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{category.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
                    const Icon = typeInfo.categoryIcon;
                    const isDeduction = ['ABSENCE', 'LATE', 'EARLY_LEAVE', 'MEDICAL_LEAVE', 'VACATION'].includes(novelty.type);
                    
                    return (
                      <tr key={novelty.id} className="hover:bg-green-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {novelty.employeeName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-${typeInfo.categoryColor}-100 text-${typeInfo.categoryColor}-800`}>
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
                          <span className={`text-sm font-medium ${isDeduction ? 'text-red-600' : 'text-green-600'}`}>
                            {isDeduction ? '-' : '+'}{getNoveltyDisplayValue(novelty)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {novelty.description || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(novelty.id)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
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
                  {noveltyCategories.map((category) => (
                    <optgroup key={category.id} label={category.name}>
                      {category.types.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </optgroup>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor ({(() => {
                    const typeInfo = getNoveltyTypeInfo(formData.type);
                    return getUnitLabel(typeInfo.unitType);
                  })()})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados registrados</h3>
          <p className="mt-1 text-sm text-gray-500">
            Primero registra empleados para poder gestionar novedades.
          </p>
        </div>
      )}
    </div>
  );
};
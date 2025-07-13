import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  Users, 
  DollarSign,
  Clock,
  Award,
  Heart,
  Briefcase,
  Gift
} from 'lucide-react';
import { Employee, Novelty, NoveltyType } from '../types';

interface NoveltyManagementProps {
  employees: Employee[];
  novelties: Novelty[];
  onAddNovelty: (novelty: Omit<Novelty, 'id'>) => void;
  onUpdateNovelty: (id: string, novelty: Partial<Novelty>) => void;
  onDeleteNovelty: (id: string) => void;
  currentMonth: string;
}

const noveltyCategories = [
  {
    id: 'disciplinary',
    name: 'Disciplinarias',
    color: 'red',
    icon: AlertTriangle,
    types: [
      { value: 'LLAMADO_ATENCION', label: 'Llamado de atención', unitType: 'MONEY' },
      { value: 'SUSPENSION', label: 'Suspensión', unitType: 'DAYS' },
      { value: 'MULTA', label: 'Multa', unitType: 'MONEY' }
    ]
  },
  {
    id: 'health',
    name: 'Salud',
    color: 'blue',
    icon: Heart,
    types: [
      { value: 'INCAPACIDAD_EPS', label: 'Incapacidad EPS', unitType: 'DAYS' },
      { value: 'INCAPACIDAD_ARL', label: 'Incapacidad ARL', unitType: 'DAYS' },
      { value: 'LICENCIA_MATERNIDAD', label: 'Licencia de maternidad', unitType: 'DAYS' }
    ]
  },
  {
    id: 'vacation',
    name: 'Vacaciones',
    color: 'green',
    icon: Calendar,
    types: [
      { value: 'VACACIONES', label: 'Vacaciones', unitType: 'DAYS' },
      { value: 'COMPENSATORIO', label: 'Compensatorio', unitType: 'DAYS' }
    ]
  },
  {
    id: 'bonifications',
    name: 'Bonificaciones',
    color: 'purple',
    icon: Award,
    types: [
      { value: 'HORAS_EXTRA_FIJAS', label: 'Horas extra fijas', unitType: 'HOURS' },
      { value: 'HORAS_EXTRA_NE', label: 'Horas extra NE', unitType: 'HOURS' },
      { value: 'RECARGO_NOCTURNO', label: 'Recargo nocturno', unitType: 'HOURS' },
      { value: 'FESTIVOS', label: 'Festivos', unitType: 'DAYS' },
      { value: 'BONIFICACION_VENTA', label: 'Bonificación en venta', unitType: 'MONEY' },
      { value: 'BONIFICACION_ESPECIAL', label: 'Bonificación especial', unitType: 'MONEY' }
    ]
  },
  {
    id: 'licenses',
    name: 'Licencias',
    color: 'indigo',
    icon: Gift,
    types: [
      { value: 'STUDY_LICENSE', label: 'Licencia por estudio', unitType: 'MONEY' }
    ]
  },
  {
    id: 'deductions',
    name: 'Deducciones',
    color: 'gray',
    icon: DollarSign,
    types: [
      { value: 'PLAN_CORPORATIVO', label: 'Plan corporativo', unitType: 'MONEY' },
      { value: 'RECORDAR', label: 'Recordar', unitType: 'MONEY' },
      { value: 'INVENTARIOS_CRUCES', label: 'Inventarios cruces', unitType: 'MONEY' },
      { value: 'MULTAS', label: 'Multas', unitType: 'MONEY' },
      { value: 'FONDO_EMPLEADOS', label: 'Fondo empleados', unitType: 'MONEY' },
      { value: 'CARTERA_EMPLEADOS', label: 'Cartera empleados', unitType: 'MONEY' }
    ]
  }
];

const getNoveltyTypeInfo = (type: NoveltyType) => {
  for (const category of noveltyCategories) {
    const typeInfo = category.types.find(t => t.value === type);
    if (typeInfo) {
      return {
        ...typeInfo,
        categoryColor: category.color,
        categoryIcon: category.icon
      };
    }
  }
  return { 
    label: type, 
    unitType: 'MONEY' as const, 
    categoryColor: 'gray', 
    categoryIcon: DollarSign 
  };
};

const getUnitLabel = (unitType: string) => {
  switch (unitType) {
    case 'HOURS': return 'horas';
    case 'DAYS': return 'días';
    case 'MONEY': return 'pesos';
    default: return 'unidades';
  }
};

export const NoveltyManagement: React.FC<NoveltyManagementProps> = ({
  employees,
  novelties,
  onAddNovelty,
  onUpdateNovelty,
  onDeleteNovelty,
  currentMonth
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNovelty, setEditingNovelty] = useState<Novelty | null>(null);
  const [formCategory, setFormCategory] = useState<string>('');
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'HORAS_EXTRA_FIJAS' as NoveltyType,
    date: new Date().toISOString().split('T')[0],
    value: '',
    description: ''
  });

  // Auto-apply recurring licenses
  useEffect(() => {
    const applyRecurringLicenses = () => {
      const currentDate = new Date();
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Find all licenses that should be recurring
      const recurringLicenses = novelties.filter(n => 
        n.type === 'STUDY_LICENSE' && 
        n.isRecurring &&
        n.startMonth &&
        n.startMonth <= currentMonthStr
      );

      recurringLicenses.forEach(license => {
        // Check if this license already exists for current month
        const existsThisMonth = novelties.some(n => 
          n.employeeId === license.employeeId &&
          n.type === license.type &&
          n.date.startsWith(currentMonthStr) &&
          n.id !== license.id
        );

        if (!existsThisMonth) {
          // Auto-apply the license for current month
          onAddNovelty({
            employeeId: license.employeeId,
            type: license.type,
            date: `${currentMonthStr}-01`,
            value: license.value,
            description: `Auto-aplicada desde ${license.startMonth}`,
            isRecurring: true,
            startMonth: license.startMonth
          });
        }
      });
    };

    applyRecurringLicenses();
  }, [novelties, onAddNovelty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const noveltyData = {
      employeeId: formData.employeeId,
      type: formData.type,
      date: formData.date,
      value: parseFloat(formData.value),
      description: formData.description
    };

    // Check if it's a license type and should be recurring
    if (formData.type === 'STUDY_LICENSE') {
      const startMonth = formData.date.substring(0, 7); // YYYY-MM format
      Object.assign(noveltyData, {
        isRecurring: true,
        startMonth: startMonth
      });
    }

    if (editingNovelty) {
      onUpdateNovelty(editingNovelty.id, noveltyData);
    } else {
      onAddNovelty(noveltyData);
    }
    
    setIsFormOpen(false);
    setEditingNovelty(null);
    setFormData({
      employeeId: '',
      type: 'HORAS_EXTRA_FIJAS',
      date: new Date().toISOString().split('T')[0],
      value: '',
      description: ''
    });
  };

  const handleEdit = (novelty: Novelty) => {
    setEditingNovelty(novelty);
    setFormData({
      employeeId: novelty.employeeId,
      type: novelty.type,
      date: novelty.date,
      value: novelty.value.toString(),
      description: novelty.description || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const novelty = novelties.find(n => n.id === id);
    
    if (novelty?.isRecurring && novelty.type === 'STUDY_LICENSE') {
      const confirmMessage = `¿Estás seguro de eliminar esta licencia recurrente?\n\nEsto detendrá la aplicación automática de la licencia en futuros meses.`;
      if (window.confirm(confirmMessage)) {
        onDeleteNovelty(id);
      }
    } else {
      if (window.confirm('¿Estás seguro de eliminar esta novedad?')) {
        onDeleteNovelty(id);
      }
    }
  };

  const openForm = (category?: string) => {
    setFormCategory(category || '');
    if (category) {
      const categoryData = noveltyCategories.find(c => c.id === category);
      if (categoryData && categoryData.types.length > 0) {
        setFormData(prev => ({ ...prev, type: categoryData.types[0].value as NoveltyType }));
      }
    }
    setIsFormOpen(true);
  };

  const employeesWithNoveltiesData = employees.map(employee => {
    const employeeNovelties = novelties.filter(n => n.employeeId === employee.id);
    const noveltiesByCategory = noveltyCategories.reduce((acc, category) => {
      acc[category.id] = employeeNovelties.filter(novelty => 
        category.types.some(type => type.value === novelty.type)
      );
      return acc;
    }, {} as Record<string, Novelty[]>);

    return {
      employee,
      novelties: employeeNovelties,
      noveltiesByCategory
    };
  }).filter(data => data.novelties.length > 0);

  const employeesWithoutNovelties = employees.filter(employee => 
    !novelties.some(novelty => novelty.employeeId === employee.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Novedades</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => openForm()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Novedad Individual
          </button>
        </div>
      </div>

      {/* Category buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {noveltyCategories.map((category) => {
          const Icon = category.icon;
          const colorClasses = {
            red: 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800',
            blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800',
            green: 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800',
            purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800',
            indigo: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800',
            gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800'
          };

          return (
            <button
              key={category.id}
              onClick={() => openForm(category.id)}
              className={`p-4 rounded-lg border-2 border-transparent transition-all ${colorClasses[category.color as keyof typeof colorClasses]}`}
            >
              <Icon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Employees without novelties */}
      {employeesWithoutNovelties.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Empleados sin Novedades Registradas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeesWithoutNovelties.map((employee) => (
              <div key={employee.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{employee.name}</h4>
                    <p className="text-sm text-gray-500">{employee.position}</p>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, employeeId: employee.id }));
                      openForm();
                    }}
                    className="text-orange-600 hover:text-orange-800 p-1"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees with novelties */}
      {employeesWithNoveltiesData.length > 0 && (
        <div className="space-y-6">
          {employeesWithNoveltiesData.map(({ employee, noveltiesByCategory }) => (
            <div key={employee.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-2 rounded-full mr-3">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.position}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, employeeId: employee.id }));
                      openForm();
                    }}
                    className="bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">
                {noveltyCategories.map((category) => {
                  const categoryNovelties = noveltiesByCategory[category.id] || [];
                  if (categoryNovelties.length === 0) return null;

                  const Icon = category.icon;
                  const colorClasses = {
                    red: 'border-red-500 text-red-700 bg-red-50',
                    blue: 'border-blue-500 text-blue-700 bg-blue-50',
                    green: 'border-green-500 text-green-700 bg-green-50',
                    purple: 'border-purple-500 text-purple-700 bg-purple-50',
                    indigo: 'border-indigo-500 text-indigo-700 bg-indigo-50',
                    gray: 'border-gray-500 text-gray-700 bg-gray-50'
                  };

                  return (
                    <div
                      key={category.id}
                      className={`px-4 py-2 border-b-2 ${colorClasses[category.color as keyof typeof colorClasses]} flex items-center`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="ml-2 bg-white px-2 py-1 rounded-full text-xs font-semibold">
                        {categoryNovelties.length}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Novelties table */}
              <div className="table-container">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
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
                    {Object.values(noveltiesByCategory).flat().map((novelty) => {
                      const typeInfo = getNoveltyTypeInfo(novelty.type);
                      const Icon = typeInfo.categoryIcon;
                      const isDeduction = ['LLAMADO_ATENCION', 'SUSPENSION', 'MULTA'].includes(novelty.type);

                      const getQuantityDisplay = () => {
                        if (typeInfo.unitType === 'HOURS') {
                          return `${novelty.value} horas`;
                        } else if (typeInfo.unitType === 'DAYS') {
                          return `${novelty.value} días`;
                        }
                        return '-';
                      };

                      const getMoneyValue = () => {
                        if (typeInfo.unitType === 'MONEY') {
                          return novelty.value;
                        } else if (typeInfo.unitType === 'HOURS') {
                          if (novelty.type === 'HORAS_EXTRA_FIJAS') return novelty.value * 6200;
                          if (novelty.type === 'HORAS_EXTRA_NE') return novelty.value * 7800;
                          if (novelty.type === 'RECARGO_NOCTURNO') return novelty.value * 2200;
                        } else if (typeInfo.unitType === 'DAYS') {
                          if (novelty.type === 'FESTIVOS') return novelty.value * 37200;
                        }
                        return novelty.value;
                      };

                      return (
                        <tr key={novelty.id} className="hover:bg-green-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-${typeInfo.categoryColor}-100 text-${typeInfo.categoryColor}-800`}>
                              <Icon className="h-3 w-3 mr-1" />
                              {typeInfo.label}
                              {novelty.isRecurring && (
                                <span className="ml-1 text-xs">🔄</span>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{new Date(novelty.date).toLocaleDateString()}</span>
                              {novelty.isRecurring && (
                                <span className="ml-2 text-xs text-indigo-600 font-medium">
                                  (Desde {novelty.startMonth})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{getQuantityDisplay()}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${isDeduction || ['PLAN_CORPORATIVO', 'RECORDAR', 'INVENTARIOS_CRUCES', 'MULTAS', 'FONDO_EMPLEADOS', 'CARTERA_EMPLEADOS'].includes(novelty.type) ? 'text-red-600' : 'text-green-600'}`}>
                              {isDeduction || ['PLAN_CORPORATIVO', 'RECORDAR', 'INVENTARIOS_CRUCES', 'MULTAS', 'FONDO_EMPLEADOS', 'CARTERA_EMPLEADOS'].includes(novelty.type) ? '-' : '+'}
                              ${getMoneyValue().toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">{novelty.description || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button onClick={() => handleEdit(novelty)} className="text-blue-600 hover:text-blue-800 p-1 mr-2">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(novelty.id)} className="text-red-600 hover:text-red-800 p-1">
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
          ))}
        </div>
      )}

      {/* Individual novelty form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{editingNovelty ? 'Editar Novedad' : 'Registrar Novedad Individual'}</h3>
            
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
                  {noveltyCategories
                    .filter((cat) => !formCategory || cat.id === formCategory)
                    .map((category) => (
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
                  onClick={() => { setIsFormOpen(false); setEditingNovelty(null); }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {editingNovelty ? 'Actualizar' : 'Registrar'}
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
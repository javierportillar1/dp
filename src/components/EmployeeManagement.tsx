import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Phone, Mail, Building } from 'lucide-react';
import { Employee } from '../types';

interface EmployeeManagementProps {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
}

// Helper function to calculate worked days from creation date
// This calculates total worked days since hiring date

const calculateWorkedDays = (createdDate?: string): number => {
  if (!createdDate) return 1; // Default for existing employees
  
  const created = new Date(createdDate);
  const now = new Date();
  
  // Set both dates to Colombia timezone (UTC-5)
  const colombiaOffset = -5 * 60; // -5 hours in minutes
  const createdColombia = new Date(created.getTime() + (colombiaOffset * 60 * 1000));
  const nowColombia = new Date(now.getTime() + (colombiaOffset * 60 * 1000));
  
  // Calculate difference in days
  const diffTime = nowColombia.getTime() - createdColombia.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays); // Total days worked since hiring
};

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, setEmployees }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    eps: '',
    contractType: 'NOMINA' as 'OPS' | 'NOMINA',
    cedula: '',
    salary: '',
    createdDate: new Date().toISOString().slice(0, 10),
    isPensioned: false,
  });

  const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));

  const resetForm = () => {
    setFormData({
      name: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      eps: '',
      contractType: 'NOMINA',
      cedula: '',
      salary: '',
      createdDate: new Date().toISOString().slice(0, 10),
      isPensioned: false,
    });
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const employeeData = {
      ...formData,
      dateOfBirth: formData.dateOfBirth,
      salary: parseFloat(formData.salary),
      isPensioned: formData.isPensioned,
      workedDays: editingEmployee ? editingEmployee.workedDays : calculateWorkedDays(formData.createdDate),
      createdDate: editingEmployee ? editingEmployee.createdDate : formData.createdDate,
    };

    if (editingEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === editingEmployee.id ? { ...employeeData, id: editingEmployee.id } : emp
      ));
    } else {
      const newEmployee: Employee = {
        ...employeeData,
        id: crypto.randomUUID(),
      };
      setEmployees([...employees, newEmployee]);
    }

    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      dateOfBirth: employee.dateOfBirth,
      phone: employee.phone,
      email: employee.email,
      eps: employee.eps,
      contractType: employee.contractType,
      cedula: employee.cedula,
      salary: employee.salary.toString(),
      createdDate: employee.createdDate || new Date().toISOString().slice(0, 10),
      isPensioned: employee.isPensioned || false,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Empleado</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula
                  </label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EPS
                  </label>
                  <input
                    type="text"
                    value={formData.eps}
                    onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Contrato
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value as 'OPS' | 'NOMINA' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NOMINA">Nómina</option>
                    <option value="OPS">OPS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salario Mensual
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPensioned"
                    checked={formData.isPensioned}
                    onChange={(e) => setFormData({ ...formData, isPensioned: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPensioned" className="text-sm font-medium text-gray-700">
                    Empleado pensionado
                  </label>
                </div>
                
                {!editingEmployee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Ingreso
                    </label>
                    <input
                      type="date"
                      value={formData.createdDate}
                      onChange={(e) => setFormData({ ...formData, createdDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingEmployee ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEmployees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-gray-500">{employee.contractType}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(employee)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(employee.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span>{employee.eps}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-gray-600">Salario: <span className="font-semibold">${employee.salary.toLocaleString()}</span></p>
                <p className="text-gray-600">Días trabajados totales: <span className="font-semibold">{employee.workedDays}</span></p>
                {employee.isPensioned && (
                  <p className="text-blue-600 text-sm font-medium">✓ Empleado pensionado</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

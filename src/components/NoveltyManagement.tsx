                        return novelty.bonusAmount;
                      }
                      return 0;
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
```
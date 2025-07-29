// src/components/EditarDeuda.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePayment } from '../services/paymentsService';

function EditarDeuda({ deuda, onClose, onDeudaActualizada }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'banco',
    montoOriginal: '',
    montoActual: '',
    fechaVencimiento: '',
    tasaInteres: '',
    incluyeIGV: false,
    esRecurrente: false,
    frecuencia: 'mensual',
    prioridad: 'media',
    entidadNombre: '',
    entidadTelefono: '',
    recordatorios: 7
  });
  const [error, setError] = useState('');

  // Cargar datos de la deuda al montar el componente
  useEffect(() => {
    if (deuda) {
      // Convertir fecha para el input
      const fechaVencimiento = deuda.fechaVencimiento?.toDate 
        ? deuda.fechaVencimiento.toDate() 
        : new Date(deuda.fechaVencimiento);
      
      setFormData({
        titulo: deuda.titulo || '',
        descripcion: deuda.descripcion || '',
        categoria: deuda.categoria || 'banco',
        montoOriginal: deuda.montoOriginal || '',
        montoActual: deuda.montoActual || '',
        fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        tasaInteres: deuda.tasaInteres || '',
        incluyeIGV: deuda.incluyeIGV || false,
        esRecurrente: deuda.esRecurrente || false,
        frecuencia: deuda.frecuencia || 'mensual',
        prioridad: deuda.prioridad || 'media',
        entidadNombre: deuda.entidad?.nombre || '',
        entidadTelefono: deuda.entidad?.telefono || '',
        recordatorios: deuda.recordatorios?.dias?.[0] || 7
      });
    }
  }, [deuda]);

  const categorias = [
    { value: 'banco', label: 'Préstamo Bancario', icon: '🏦' },
    { value: 'tarjeta', label: 'Tarjeta de Crédito', icon: '💳' },
    { value: 'personal', label: 'Préstamo Personal', icon: '👥' },
    { value: 'servicios', label: 'Servicios (Luz, Agua)', icon: '⚡' },
    { value: 'impuestos', label: 'Impuestos', icon: '📋' },
    { value: 'otros', label: 'Otros', icon: '📝' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calcularIGV = (monto) => {
    return formData.incluyeIGV ? (parseFloat(monto) * 0.18) : 0;
  };

  const calcularMontoConIGV = (monto) => {
    return formData.incluyeIGV ? (parseFloat(monto) * 1.18) : parseFloat(monto);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.titulo || !formData.montoOriginal || !formData.fechaVencimiento) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      const montoOriginal = parseFloat(formData.montoOriginal);
      const montoActual = formData.montoActual ? parseFloat(formData.montoActual) : montoOriginal;

      // Preparar datos actualizados
      const datosActualizados = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        montoOriginal: montoOriginal,
        montoActual: montoActual,
        montoIGV: calcularIGV(montoActual),
        montoTotal: calcularMontoConIGV(montoActual),
        fechaVencimiento: new Date(formData.fechaVencimiento),
        tasaInteres: formData.tasaInteres ? parseFloat(formData.tasaInteres) : 0,
        incluyeIGV: formData.incluyeIGV,
        porcentajeIGV: 18,
        esRecurrente: formData.esRecurrente,
        frecuencia: formData.frecuencia,
        prioridad: formData.prioridad,
        entidad: {
          nombre: formData.entidadNombre,
          telefono: formData.entidadTelefono
        },
        recordatorios: {
          dias: [parseInt(formData.recordatorios)],
          email: true,
          push: true
        }
      };

      // Actualizar en Firebase
      await updatePayment(user.uid, deuda.id, datosActualizados);
      
      // Notificar éxito
      onDeudaActualizada?.();
      onClose?.();
      
    } catch (error) {
      console.error('Error al actualizar deuda:', error);
      setError(error.message || 'Error al actualizar la deuda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Editar Deuda</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título de la Deuda *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej: Préstamo BCP Auto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Detalles adicionales..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Montos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Montos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Original (S/) *
                </label>
                <input
                  type="number"
                  name="montoOriginal"
                  value={formData.montoOriginal}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Actual (S/)
                </label>
                <input
                  type="number"
                  name="montoActual"
                  value={formData.montoActual}
                  onChange={handleChange}
                  placeholder="Usar monto original"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="incluyeIGV"
                  checked={formData.incluyeIGV}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Incluye IGV (18%)</span>
              </label>
              
              {formData.incluyeIGV && formData.montoActual && (
                <div className="text-sm text-green-600">
                  IGV: S/ {calcularIGV(formData.montoActual || formData.montoOriginal).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Fechas y Términos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Fechas y Términos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  name="fechaVencimiento"
                  value={formData.fechaVencimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasa de Interés (% anual)
                </label>
                <input
                  type="number"
                  name="tasaInteres"
                  value={formData.tasaInteres}
                  onChange={handleChange}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="baja">🟢 Baja</option>
                  <option value="media">🟡 Media</option>
                  <option value="alta">🔴 Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recordar (días antes)
                </label>
                <select
                  name="recordatorios"
                  value={formData.recordatorios}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 día antes</option>
                  <option value="3">3 días antes</option>
                  <option value="7">7 días antes</option>
                  <option value="15">15 días antes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recurrencia */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="esRecurrente"
                checked={formData.esRecurrente}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Es un pago recurrente
              </label>
            </div>

            {formData.esRecurrente && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia
                </label>
                <select
                  name="frecuencia"
                  value={formData.frecuencia}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                </select>
              </div>
            )}
          </div>

          {/* Entidad */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Información de la Entidad</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Entidad
                </label>
                <input
                  type="text"
                  name="entidadNombre"
                  value={formData.entidadNombre}
                  onChange={handleChange}
                  placeholder="Ej: Banco de Crédito del Perú"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  name="entidadTelefono"
                  value={formData.entidadTelefono}
                  onChange={handleChange}
                  placeholder="01-311-9898"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar Deuda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarDeuda;
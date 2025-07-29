// src/components/PaymentForm.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addPayment } from '../services/paymentsService';

function PaymentForm({ onClose, onPaymentAdded }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    dueDate: '',
    category: 'otros',
    description: '',
    recurring: false,
    recurringType: 'monthly',
    priority: 'medium',
    paymentMethod: 'efectivo',
    provider: '',
    accountNumber: '',
    reminderDays: 3,
    tags: '',
    notes: '',
    isDebt: false,
    originalAmount: '',
    interestRate: '',
    minimumPayment: ''
  });

  const categories = [
    { value: 'servicios', label: '🔌 Servicios Básicos', subcategories: ['Luz', 'Agua', 'Gas', 'Internet', 'Teléfono'] },
    { value: 'prestamos', label: '🏦 Préstamos', subcategories: ['Personal', 'Hipotecario', 'Vehicular', 'Educativo'] },
    { value: 'tarjetas', label: '💳 Tarjetas de Crédito', subcategories: ['Visa', 'MasterCard', 'American Express'] },
    { value: 'alquiler', label: '🏠 Vivienda', subcategories: ['Alquiler', 'Hipoteca', 'Mantenimiento', 'Seguro hogar'] },
    { value: 'seguros', label: '🛡️ Seguros', subcategories: ['Vida', 'Salud', 'Vehicular', 'Hogar'] },
    { value: 'suscripciones', label: '📺 Suscripciones', subcategories: ['Netflix', 'Spotify', 'Software', 'Gym'] },
    { value: 'transporte', label: '🚗 Transporte', subcategories: ['Combustible', 'Mantenimiento', 'Seguro vehicular'] },
    { value: 'educacion', label: '📚 Educación', subcategories: ['Colegio', 'Universidad', 'Cursos'] },
    { value: 'salud', label: '🏥 Salud', subcategories: ['Médico', 'Medicinas', 'Dental', 'Laboratorio'] },
    { value: 'impuestos', label: '📋 Impuestos', subcategories: ['Renta', 'Predial', 'Vehicular', 'IGV'] },
    { value: 'otros', label: '📦 Otros', subcategories: [] }
  ];

  const priorityOptions = [
    { value: 'high', label: '🔴 Alta', color: 'text-red-600' },
    { value: 'medium', label: '🟡 Media', color: 'text-yellow-600' },
    { value: 'low', label: '🟢 Baja', color: 'text-green-600' }
  ];

  const paymentMethods = [
    { value: 'efectivo', label: '💵 Efectivo' },
    { value: 'transferencia', label: '🏦 Transferencia Bancaria' },
    { value: 'tarjeta_debito', label: '💳 Tarjeta de Débito' },
    { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
    { value: 'billetera_digital', label: '📱 Billetera Digital' },
    { value: 'cheque', label: '📝 Cheque' },
    { value: 'descuento_automatico', label: '🔄 Descuento Automático' }
  ];

  const recurringOptions = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'semiannual', label: 'Semestral' },
    { value: 'yearly', label: 'Anual' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('El título es requerido');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('El monto debe ser mayor a 0');
      return false;
    }
    if (!formData.dueDate) {
      setError('La fecha de vencimiento es requerida');
      return false;
    }
    if (formData.isDebt && formData.originalAmount && parseFloat(formData.originalAmount) < parseFloat(formData.amount)) {
      setError('El monto original no puede ser menor al monto actual');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        originalAmount: formData.originalAmount ? parseFloat(formData.originalAmount) : null,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : null,
        minimumPayment: formData.minimumPayment ? parseFloat(formData.minimumPayment) : null,
        reminderDays: parseInt(formData.reminderDays),
        dueDate: new Date(formData.dueDate),
        status: 'pending',
        userId: user.uid,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      await addPayment(user.uid, paymentData);
      
      // Limpiar formulario
      setFormData({
        title: '',
        amount: '',
        dueDate: '',
        category: 'otros',
        description: '',
        recurring: false,
        recurringType: 'monthly',
        priority: 'medium',
        paymentMethod: 'efectivo',
        provider: '',
        accountNumber: '',
        reminderDays: 3,
        tags: '',
        notes: '',
        isDebt: false,
        originalAmount: '',
        interestRate: '',
        minimumPayment: ''
      });

      if (onPaymentAdded) onPaymentAdded();
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error al agregar pago:', error);
      setError('Error al agregar el pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.value === formData.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[95vh]">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {formData.isDebt ? 'Registrar Deuda' : 'Agregar Pago'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Completa la información del {formData.isDebt ? 'préstamo o deuda' : 'pago'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Tipo */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isDebt: false }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !formData.isDebt
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                💳 Pago Regular
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isDebt: true }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  formData.isDebt
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🏦 Deuda/Préstamo
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del {formData.isDebt ? 'Préstamo/Deuda' : 'Pago'} *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={formData.isDebt ? "Ej: Préstamo Personal Banco XYZ" : "Ej: Factura de Luz"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.isDebt ? 'Saldo Actual' : 'Monto'} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">S/</span>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Monto Original (solo para deudas) */}
              {formData.isDebt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Original
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">S/</span>
                    <input
                      type="number"
                      name="originalAmount"
                      min="0"
                      step="0.01"
                      value={formData.originalAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Fecha de Vencimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  required
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Información del Proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor/Empresa
                </label>
                <input
                  type="text"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  placeholder="Ej: Luz del Sur, Banco de Crédito"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  N° de Cuenta/Contrato
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="Número de referencia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Información de Deuda (solo para deudas) */}
            {formData.isDebt && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="md:col-span-2">
                  <h4 className="font-medium text-red-800 mb-3">Información de Deuda</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    Tasa de Interés (% anual)
                  </label>
                  <input
                    type="number"
                    name="interestRate"
                    min="0"
                    step="0.1"
                    value={formData.interestRate}
                    onChange={handleChange}
                    placeholder="15.5"
                    className="w-full px-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    Pago Mínimo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-red-500">S/</span>
                    <input
                      type="number"
                      name="minimumPayment"
                      min="0"
                      step="0.01"
                      value={formData.minimumPayment}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Recordatorio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recordar con anticipación (días)
              </label>
              <select
                name="reminderDays"
                value={formData.reminderDays}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1 día antes</option>
                <option value="3">3 días antes</option>
                <option value="7">1 semana antes</option>
                <option value="15">15 días antes</option>
                <option value="30">1 mes antes</option>
              </select>
            </div>

            {/* Pago Recurrente */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="recurring"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                  Pago recurrente
                </label>
              </div>

              {formData.recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia
                  </label>
                  <select
                    name="recurringType"
                    value={formData.recurringType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {recurringOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas (separadas por comas)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="urgente, hogar, trabajo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción/Notas
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Detalles adicionales, observaciones, etc..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  formData.isDebt
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  `${formData.isDebt ? 'Registrar Deuda' : 'Agregar Pago'}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentForm;
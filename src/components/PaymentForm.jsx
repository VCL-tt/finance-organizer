// src/components/PaymentForm.jsx - VERSIÓN SIMPLIFICADA
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
    priority: 'medium',
    paymentMethod: 'efectivo',
    provider: '',
    isDebt: false,
    originalAmount: '',
    interestRate: '',
    minimumPayment: ''
  });

  // SIMPLIFICADO - Solo 6 categorías esenciales
  const categories = [
    { value: 'servicios', label: '🔌 Servicios Básicos' },
    { value: 'prestamos', label: '🏦 Préstamos' },
    { value: 'tarjetas', label: '💳 Tarjetas de Crédito' },
    { value: 'vivienda', label: '🏠 Vivienda' },
    { value: 'seguros', label: '🛡️ Seguros' },
    { value: 'otros', label: '📦 Otros' }
  ];

  // SIMPLIFICADO - Solo 4 métodos de pago esenciales
  const paymentMethods = [
    { value: 'efectivo', label: '💵 Efectivo' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'tarjeta_debito', label: '💳 Tarjeta de Débito' },
    { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' }
  ];

  const priorityOptions = [
    { value: 'high', label: '🔴 Alta' },
    { value: 'medium', label: '🟡 Media' },
    { value: 'low', label: '🟢 Baja' }
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
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const paymentData = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        originalAmount: formData.originalAmount ? parseFloat(formData.originalAmount) : null,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : null,
        minimumPayment: formData.minimumPayment ? parseFloat(formData.minimumPayment) : null,
        dueDate: new Date(formData.dueDate),
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        paymentMethod: formData.paymentMethod,
        provider: formData.provider,
        isDebt: formData.isDebt,
        status: 'pending',
        userId: user.uid
      };

      await addPayment(user.uid, paymentData);
      
      // Limpiar formulario
      setFormData({
        title: '',
        amount: '',
        dueDate: '',
        category: 'otros',
        description: '',
        priority: 'medium',
        paymentMethod: 'efectivo',
        provider: '',
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
                  Título *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={formData.isDebt ? "Ej: Préstamo Personal Banco XYZ" : "Ej: Factura de Luz"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Categoría y Prioridad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Proveedor y Método de Pago */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Información de Deuda - SOLO para deudas */}
            {formData.isDebt && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-3">Información de Deuda</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-2">
                      Monto Original
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-red-500">S/</span>
                      <input
                        type="number"
                        name="originalAmount"
                        min="0"
                        step="0.01"
                        value={formData.originalAmount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-2">
                      Tasa Interés (% anual)
                    </label>
                    <input
                      type="number"
                      name="interestRate"
                      min="0"
                      step="0.1"
                      value={formData.interestRate}
                      onChange={handleChange}
                      placeholder="15.5"
                      className="w-full px-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                        className="w-full pl-10 pr-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción/Notas
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Detalles adicionales..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
// src/components/PaymentModal.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePayment, addPayment } from '../services/paymentsService';

function PaymentModal({ payment, onClose, onPaymentUpdated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentType, setPaymentType] = useState('full'); // full, partial, months
  const [paymentData, setPaymentData] = useState({
    amount: payment.amount,
    paymentDate: new Date().toISOString().split('T')[0],
    note: '',
    monthsToPay: 1,
    paymentMethod: payment.paymentMethod || 'efectivo'
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const calculateNextDueDate = (months) => {
    const currentDue = payment.dueDate?.toDate ? payment.dueDate.toDate() : new Date(payment.dueDate);
    const nextDue = new Date(currentDue);
    nextDue.setMonth(nextDue.getMonth() + months);
    return nextDue;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    
    // Resetear datos según el tipo
    if (type === 'full') {
      setPaymentData(prev => ({ ...prev, amount: payment.amount }));
    } else if (type === 'partial') {
      setPaymentData(prev => ({ ...prev, amount: payment.minimumPayment || payment.amount * 0.1 }));
    } else if (type === 'months') {
      const monthlyAmount = payment.amount / paymentData.monthsToPay;
      setPaymentData(prev => ({ ...prev, amount: monthlyAmount }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const now = new Date();
      
      if (paymentType === 'full') {
        // Pago completo - marcar como pagado
        await updatePayment(user.uid, payment.id, {
          status: 'paid',
          paidDate: new Date(paymentData.paymentDate),
          paidAmount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          paymentNote: paymentData.note,
          updatedAt: now
        });

        // Si es recurrente, crear el siguiente pago
        if (payment.recurring) {
          const nextDueDate = calculateNextDueDate(
            payment.recurringType === 'weekly' ? 0.25 :
            payment.recurringType === 'biweekly' ? 0.5 :
            payment.recurringType === 'monthly' ? 1 :
            payment.recurringType === 'quarterly' ? 3 :
            payment.recurringType === 'semiannual' ? 6 : 12
          );

          await addPayment(user.uid, {
            ...payment,
            dueDate: nextDueDate,
            status: 'pending',
            createdAt: now,
            updatedAt: now
          });
        }

      } else if (paymentType === 'partial' || paymentType === 'months') {
        // Pago parcial - reducir monto y crear historial
        const remainingAmount = payment.amount - paymentData.amount;
        
        if (remainingAmount <= 0) {
          // Si el pago parcial cubre todo, marcar como pagado
          await updatePayment(user.uid, payment.id, {
            status: 'paid',
            paidDate: new Date(paymentData.paymentDate),
            paidAmount: payment.amount,
            paymentMethod: paymentData.paymentMethod,
            paymentNote: paymentData.note,
            updatedAt: now
          });
        } else {
          // Actualizar el pago principal con el monto restante
          const paymentHistory = payment.paymentHistory || [];
          paymentHistory.push({
            amount: paymentData.amount,
            date: new Date(paymentData.paymentDate),
            method: paymentData.paymentMethod,
            note: paymentData.note,
            id: Date.now().toString()
          });

          await updatePayment(user.uid, payment.id, {
            amount: remainingAmount,
            paymentHistory,
            lastPaymentDate: new Date(paymentData.paymentDate),
            lastPaymentAmount: paymentData.amount,
            updatedAt: now
          });

          // Si se seleccionó pago por meses, programar los siguientes pagos
          if (paymentType === 'months' && paymentData.monthsToPay > 1) {
            for (let i = 1; i < paymentData.monthsToPay; i++) {
              const futureDate = new Date(paymentData.paymentDate);
              futureDate.setMonth(futureDate.getMonth() + i);
              
              await addPayment(user.uid, {
                title: `${payment.title} - Cuota ${i + 1}/${paymentData.monthsToPay}`,
                amount: paymentData.amount,
                dueDate: futureDate,
                category: payment.category,
                priority: payment.priority,
                paymentMethod: payment.paymentMethod,
                provider: payment.provider,
                description: `Cuota programada ${i + 1} de ${paymentData.monthsToPay} para: ${payment.title}`,
                isDebt: payment.isDebt,
                originalPaymentId: payment.id,
                status: 'pending',
                createdAt: now,
                updatedAt: now
              });
            }
          }
        }
      }

      if (onPaymentUpdated) onPaymentUpdated();
      onClose();

    } catch (error) {
      console.error('Error al procesar pago:', error);
      setError('Error al procesar el pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const isDebt = payment.isDebt;
  const hasMinimumPayment = payment.minimumPayment && payment.minimumPayment > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Procesar Pago</h2>
              <p className="text-sm text-gray-600 mt-1">{payment.title}</p>
              <p className="text-lg font-semibold text-blue-600 mt-2">
                Monto actual: {formatCurrency(payment.amount)}
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
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Historial de pagos si existe */}
          {payment.paymentHistory && payment.paymentHistory.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Historial de Pagos</h4>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {payment.paymentHistory.map((historyItem) => (
                  <div key={historyItem.id} className="flex justify-between text-sm text-blue-700">
                    <span>{new Date(historyItem.date).toLocaleDateString('es-ES')}</span>
                    <span>{formatCurrency(historyItem.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-blue-200 mt-2 pt-2 text-sm font-medium text-blue-800">
                Total pagado: {formatCurrency(
                  payment.paymentHistory.reduce((sum, item) => sum + item.amount, 0)
                )}
              </div>
            </div>
          )}

          {/* Opciones de pago */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Pago</h3>
            
            <div className="space-y-3">
              {/* Pago completo */}
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentType"
                  value="full"
                  checked={paymentType === 'full'}
                  onChange={(e) => handlePaymentTypeChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">💰 Pago Completo</span>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Liquidar completamente este pago</p>
                </div>
              </label>

              {/* Pago parcial (solo para deudas) */}
              {isDebt && (
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentType"
                    value="partial"
                    checked={paymentType === 'partial'}
                    onChange={(e) => handlePaymentTypeChange(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">💳 Pago Parcial</span>
                      <span className="text-yellow-600 font-semibold">
                        Personalizado
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pagar una cantidad específica
                      {hasMinimumPayment && ` (mín: ${formatCurrency(payment.minimumPayment)})`}
                    </p>
                  </div>
                </label>
              )}

              {/* Pago por meses */}
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentType"
                  value="months"
                  checked={paymentType === 'months'}
                  onChange={(e) => handlePaymentTypeChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">📅 Dividir en Cuotas</span>
                    <span className="text-blue-600 font-semibold">
                      Programar
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Dividir el pago en cuotas mensuales</p>
                </div>
              </label>
            </div>
          </div>

          {/* Formulario de pago */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Configuración para pago por meses */}
            {paymentType === 'months' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Cuotas
                </label>
                <select
                  name="monthsToPay"
                  value={paymentData.monthsToPay}
                  onChange={(e) => {
                    const months = parseInt(e.target.value);
                    setPaymentData(prev => ({
                      ...prev,
                      monthsToPay: months,
                      amount: payment.amount / months
                    }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12,18,24,36].map(months => (
                    <option key={months} value={months}>
                      {months} {months === 1 ? 'cuota' : 'cuotas'} - {formatCurrency(payment.amount / months)} c/u
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Monto a pagar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {paymentType === 'months' ? 'Monto por Cuota' : 'Monto a Pagar'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">S/</span>
                <input
                  type="number"
                  name="amount"
                  required
                  min={hasMinimumPayment && paymentType === 'partial' ? payment.minimumPayment : 0.01}
                  max={paymentType !== 'full' ? payment.amount : undefined}
                  step="0.01"
                  value={paymentData.amount}
                  onChange={handleChange}
                  disabled={paymentType === 'full' || paymentType === 'months'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              {paymentType === 'partial' && hasMinimumPayment && (
                <p className="text-sm text-gray-600 mt-1">
                  Monto mínimo: {formatCurrency(payment.minimumPayment)}
                </p>
              )}
            </div>

            {/* Fecha de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Pago
              </label>
              <input
                type="date"
                name="paymentDate"
                required
                value={paymentData.paymentDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                name="paymentMethod"
                value={paymentData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="tarjeta_debito">💳 Tarjeta de Débito</option>
                <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                <option value="billetera_digital">📱 Billetera Digital</option>
                <option value="cheque">📝 Cheque</option>
              </select>
            </div>

            {/* Nota del pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nota (opcional)
              </label>
              <textarea
                name="note"
                value={paymentData.note}
                onChange={handleChange}
                rows="3"
                placeholder="Detalles adicionales sobre este pago..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Resumen */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Resumen del Pago</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Monto a pagar ahora:</span>
                  <span className="font-semibold">{formatCurrency(paymentData.amount)}</span>
                </div>
                {paymentType !== 'full' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Saldo restante:</span>
                    <span>{formatCurrency(payment.amount - paymentData.amount)}</span>
                  </div>
                )}
                {paymentType === 'months' && paymentData.monthsToPay > 1 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Cuotas programadas:</span>
                    <span>{paymentData.monthsToPay - 1} adicionales</span>
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
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
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  `Procesar Pago`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
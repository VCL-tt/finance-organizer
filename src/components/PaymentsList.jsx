// src/components/PaymentsList.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPayments, deletePayment } from '../services/paymentsService';
import PaymentModal from './PaymentModal';

function PaymentsList({ onClose, refreshTrigger }) {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('card'); // card, table
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const categoryLabels = {
    servicios: { label: '🔌 Servicios Básicos', color: 'bg-blue-100 text-blue-800' },
    prestamos: { label: '🏦 Préstamos', color: 'bg-red-100 text-red-800' },
    tarjetas: { label: '💳 Tarjetas', color: 'bg-purple-100 text-purple-800' },
    alquiler: { label: '🏠 Vivienda', color: 'bg-green-100 text-green-800' },
    seguros: { label: '🛡️ Seguros', color: 'bg-yellow-100 text-yellow-800' },
    suscripciones: { label: '📺 Suscripciones', color: 'bg-pink-100 text-pink-800' },
    transporte: { label: '🚗 Transporte', color: 'bg-indigo-100 text-indigo-800' },
    educacion: { label: '📚 Educación', color: 'bg-teal-100 text-teal-800' },
    salud: { label: '🏥 Salud', color: 'bg-orange-100 text-orange-800' },
    impuestos: { label: '📋 Impuestos', color: 'bg-gray-100 text-gray-800' },
    otros: { label: '📦 Otros', color: 'bg-gray-100 text-gray-800' }
  };

  const priorityLabels = {
    high: { label: '🔴 Alta', color: 'bg-red-100 text-red-800' },
    medium: { label: '🟡 Media', color: 'bg-yellow-100 text-yellow-800' },
    low: { label: '🟢 Baja', color: 'bg-green-100 text-green-800' }
  };

  const paymentMethodLabels = {
    efectivo: '💵 Efectivo',
    transferencia: '🏦 Transferencia',
    tarjeta_debito: '💳 T. Débito',
    tarjeta_credito: '💳 T. Crédito',
    billetera_digital: '📱 Billetera Digital',
    cheque: '📝 Cheque',
    descuento_automatico: '🔄 Desc. Automático'
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const userPayments = await getPayments(user.uid);
      setPayments(userPayments);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      setError('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user, refreshTrigger]);

  const handleMarkAsPaid = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handlePaymentUpdated = () => {
    loadPayments();
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      try {
        await deletePayment(user.uid, paymentId);
        await loadPayments();
      } catch (error) {
        console.error('Error al eliminar pago:', error);
        setError('Error al eliminar el pago');
      }
    }
  };

  const getStatusInfo = (payment) => {
    if (payment.status === 'paid') {
      return { text: 'Pagado', color: 'bg-green-100 text-green-800', icon: '✅' };
    }
    
    const today = new Date();
    const dueDate = payment.dueDate?.toDate ? payment.dueDate.toDate() : new Date(payment.dueDate);
    
    if (dueDate < today) {
      return { text: 'Vencido', color: 'bg-red-100 text-red-800', icon: '🚨' };
    }

    const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    if (daysDiff <= payment.reminderDays || 3) {
      return { text: `${daysDiff} días`, color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' };
    }
    
    return { text: 'Pendiente', color: 'bg-blue-100 text-blue-800', icon: '📅' };
  };

  const formatDate = (date) => {
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const filterAndSortPayments = () => {
    let filtered = payments;

    // Filtro por estado
    if (filter === 'paid') {
      filtered = filtered.filter(p => p.status === 'paid');
    } else if (filter === 'pending') {
      filtered = filtered.filter(p => p.status !== 'paid');
    } else if (filter === 'overdue') {
      const today = new Date();
      filtered = filtered.filter(p => {
        const dueDate = p.dueDate?.toDate ? p.dueDate.toDate() : new Date(p.dueDate);
        return p.status !== 'paid' && dueDate < today;
      });
    } else if (filter === 'debts') {
      filtered = filtered.filter(p => p.isDebt);
    } else if (filter === 'upcoming') {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => {
        const dueDate = p.dueDate?.toDate ? p.dueDate.toDate() : new Date(p.dueDate);
        return p.status !== 'paid' && dueDate >= today && dueDate <= nextWeek;
      });
    }

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
          const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
          return dateA - dateB;
        case 'amount':
          return b.amount - a.amount;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium'];
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredPayments = filterAndSortPayments();

  const filterOptions = [
    { key: 'all', label: 'Todos', count: payments.length },
    { key: 'pending', label: 'Pendientes', count: payments.filter(p => p.status !== 'paid').length },
    { key: 'paid', label: 'Pagados', count: payments.filter(p => p.status === 'paid').length },
    { key: 'overdue', label: 'Vencidos', count: payments.filter(p => {
      const today = new Date();
      const dueDate = p.dueDate?.toDate ? p.dueDate.toDate() : new Date(p.dueDate);
      return p.status !== 'paid' && dueDate < today;
    }).length },
    { key: 'debts', label: 'Deudas', count: payments.filter(p => p.isDebt).length },
    { key: 'upcoming', label: 'Próximos 7 días', count: payments.filter(p => {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const dueDate = p.dueDate?.toDate ? p.dueDate.toDate() : new Date(p.dueDate);
      return p.status !== 'paid' && dueDate >= today && dueDate <= nextWeek;
    }).length }
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span>Cargando pagos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6 overflow-y-auto max-h-[95vh]">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mis Pagos</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredPayments.length} de {payments.length} pagos
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
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Controles superiores */}
          <div className="space-y-4 mb-6">
            
            {/* Búsqueda y vista */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por título, descripción, proveedor o etiquetas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  {Object.entries(categoryLabels).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dueDate">Fecha vencimiento</option>
                  <option value="amount">Monto</option>
                  <option value="priority">Prioridad</option>
                  <option value="title">Título</option>
                  <option value="category">Categoría</option>
                </select>

                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-1 rounded text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}
                  >
                    📋
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded text-sm ${viewMode === 'table' ? 'bg-white shadow' : ''}`}
                  >
                    📊
                  </button>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === filterOption.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label} ({filterOption.count})
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Pagos */}
          <div className="overflow-y-auto max-h-96">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">
                  {searchTerm ? '🔍' : filter === 'all' ? '💳' : '📋'}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm 
                    ? 'No se encontraron pagos'
                    : filter === 'all' 
                    ? 'No tienes pagos registrados'
                    : `No hay pagos ${filter === 'pending' ? 'pendientes' : filter === 'paid' ? 'pagados' : filter === 'debts' ? 'como deudas' : 'en esta categoría'}`
                  }
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : filter === 'all' 
                    ? 'Agrega tu primer pago para comenzar'
                    : 'Cambia el filtro para ver otros pagos'
                  }
                </p>
              </div>
            ) : viewMode === 'card' ? (
              // Vista de tarjetas
              <div className="space-y-4">
                {filteredPayments.map(payment => {
                  const statusInfo = getStatusInfo(payment);
                  const categoryInfo = categoryLabels[payment.category] || categoryLabels.otros;
                  const priorityInfo = priorityLabels[payment.priority || 'medium'];
                  
                  return (
                    <div key={payment.id} className={`rounded-lg p-4 border-l-4 transition-all hover:shadow-md ${
                      payment.isDebt ? 'bg-red-50 border-red-400' : 'bg-gray-50 border-blue-400'
                    }`}>
                      
                      {/* Header de la tarjeta */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{payment.title}</h3>
                            {payment.isDebt && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                🏦 Deuda
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.icon} {statusInfo.text}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                              {priorityInfo.label}
                            </span>
                            {payment.recurring && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                🔄 Recurrente
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 ml-4">
                          {payment.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(payment)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                              title="Procesar pago"
                            >
                              💰 Pagar
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            title="Eliminar pago"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Información principal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Monto:</span>
                          <p className="font-semibold text-lg">{formatCurrency(payment.amount)}</p>
                        </div>
                        
                        <div>
                          <span className="text-gray-600">Vence:</span>
                          <p className="font-medium">{formatDate(payment.dueDate)}</p>
                        </div>

                        {payment.provider && (
                          <div>
                            <span className="text-gray-600">Proveedor:</span>
                            <p className="font-medium">{payment.provider}</p>
                          </div>
                        )}

                        <div>
                          <span className="text-gray-600">Método:</span>
                          <p className="font-medium">{paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}</p>
                        </div>
                      </div>

                      {/* Información adicional para deudas */}
                      {payment.isDebt && (
                        <div className="mt-3 pt-3 border-t border-red-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {payment.originalAmount && (
                            <div>
                              <span className="text-red-600">Monto Original:</span>
                              <p className="font-medium">{formatCurrency(payment.originalAmount)}</p>
                            </div>
                          )}
                          {payment.interestRate && (
                            <div>
                              <span className="text-red-600">Tasa Interés:</span>
                              <p className="font-medium">{payment.interestRate}% anual</p>
                            </div>
                          )}
                          {payment.minimumPayment && (
                            <div>
                              <span className="text-red-600">Pago Mínimo:</span>
                              <p className="font-medium">{formatCurrency(payment.minimumPayment)}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags y descripción */}
                      {(payment.tags?.length > 0 || payment.description) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {payment.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {payment.tags.map((tag, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {payment.description && (
                            <p className="text-sm text-gray-600">{payment.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Vista de tabla
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimiento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map(payment => {
                      const statusInfo = getStatusInfo(payment);
                      const categoryInfo = categoryLabels[payment.category] || categoryLabels.otros;
                      
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {payment.title}
                                {payment.isDebt && <span className="ml-2 text-red-600">🏦</span>}
                              </div>
                              {payment.provider && (
                                <div className="text-sm text-gray-500">{payment.provider}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                              {statusInfo.icon} {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {payment.status !== 'paid' && (
                                <button
                                  onClick={() => handleMarkAsPaid(payment)}
                                  className="text-green-600 hover:text-green-900 px-2 py-1 rounded font-medium"
                                  title="Procesar pago"
                                >
                                  💰 Pagar
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(payment.id)}
                                className="text-red-600 hover:text-red-900 px-2 py-1 rounded font-medium"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando {filteredPayments.length} de {payments.length} pagos
            </div>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && selectedPayment && (
        <PaymentModal
          payment={selectedPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
          onPaymentUpdated={handlePaymentUpdated}
        />
      )}
    </div>
  );
}

export default PaymentsList;
// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/auth';
import { getPayments } from '../services/paymentsService';
import { useNavigate } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';
import PaymentsList from '../components/PaymentsList';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentsList, setShowPaymentsList] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cargar pagos al montar el componente
  useEffect(() => {
    loadPayments();
  }, [user, refreshTrigger]);

  const loadPayments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userPayments = await getPayments(user.uid);
      setPayments(userPayments);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handlePaymentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowPaymentForm(false);
  };

  // Calcular estadísticas
  const calculateStats = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Pagos del mes actual
    const monthlyPayments = payments.filter(payment => {
      const paymentDate = payment.dueDate?.toDate ? payment.dueDate.toDate() : new Date(payment.dueDate);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    const monthlyTotal = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Pagos pendientes
    const pendingPayments = payments.filter(payment => payment.status !== 'paid');

    // Pagos vencidos
    const overdue = payments.filter(payment => {
      if (payment.status === 'paid') return false;
      const dueDate = payment.dueDate?.toDate ? payment.dueDate.toDate() : new Date(payment.dueDate);
      return dueDate < today;
    });

    return {
      monthlyTotal,
      pendingCount: pendingPayments.length,
      overdueCount: overdue.length
    };
  };

  const stats = calculateStats();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  // Próximos pagos (5 más cercanos)
  const getUpcomingPayments = () => {
    const pending = payments.filter(payment => payment.status !== 'paid');
    return pending
      .sort((a, b) => {
        const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
        const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
        return dateA - dateB;
      })
      .slice(0, 5);
  };

  const upcomingPayments = getUpcomingPayments();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Finance Organizer
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Hola, {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span>Cargando datos...</span>
            </div>
          ) : (
            <>
              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Resumen de pagos */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">$</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Pagos del mes
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {formatCurrency(stats.monthlyTotal)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagos pendientes */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">!</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Pagos pendientes
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.pendingCount}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagos vencidos */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">X</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Pagos vencidos
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.overdueCount}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Próximos Pagos */}
              {upcomingPayments.length > 0 && (
                <div className="bg-white shadow rounded-lg mb-8">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Próximos Pagos
                    </h3>
                    <div className="space-y-3">
                      {upcomingPayments.map(payment => {
                        const dueDate = payment.dueDate?.toDate ? payment.dueDate.toDate() : new Date(payment.dueDate);
                        const today = new Date();
                        const isOverdue = dueDate < today;
                        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium text-gray-900">{payment.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {isOverdue ? 'Vencido' : `${daysUntilDue} días`}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Vence: {dueDate.toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-medium text-gray-900">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Acciones rápidas */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Acciones Rápidas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button 
                      onClick={() => setShowPaymentForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      <span className="mr-2">+</span>
                      Agregar Pago
                    </button>
                    
                    <button 
                      onClick={() => setShowPaymentsList(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      <span className="mr-2">👁️</span>
                      Ver Pagos
                    </button>
                    
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center">
                      <span className="mr-2">🧮</span>
                      Calcular Préstamo
                    </button>
                    
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center">
                      <span className="mr-2">📊</span>
                      Ver Historial
                    </button>
                  </div>
                </div>
              </div>

              {/* Estado vacío cuando no hay pagos */}
              {payments.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💳</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    ¡Bienvenido a Finance Organizer!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza agregando tu primer pago o deuda para tomar control de tus finanzas.
                  </p>
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Agregar Mi Primer Pago
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modales */}
      {showPaymentForm && (
        <PaymentForm
          onClose={() => setShowPaymentForm(false)}
          onPaymentAdded={handlePaymentAdded}
        />
      )}

      {showPaymentsList && (
        <PaymentsList
          onClose={() => setShowPaymentsList(false)}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
}

export default Dashboard;
// src/pages/Dashboard.jsx - CON LISTA DE PAGOS INTEGRADA
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/auth";
import { getPayments, deletePayment } from "../services/paymentsService";
import { useNavigate } from "react-router-dom";
import PaymentForm from "../components/PaymentForm";
import PaymentModal from "../components/PaymentModal";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Estados para filtros
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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
      console.error("Error al cargar pagos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handlePaymentAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
    setShowPaymentForm(false);
  };

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
    if (window.confirm("¿Estás seguro de que quieres eliminar este pago?")) {
      try {
        await deletePayment(user.uid, paymentId);
        await loadPayments();
      } catch (error) {
        console.error("Error al eliminar pago:", error);
      }
    }
  };

  // Estadísticas básicas
  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status !== "paid").length,
    overdue: payments.filter((p) => {
      if (p.status === "paid") return false;
      const dueDate = p.dueDate?.toDate
        ? p.dueDate.toDate()
        : new Date(p.dueDate);
      return dueDate < new Date();
    }).length,
    monthlyTotal: payments
      .filter((p) => {
        const dueDate = p.dueDate?.toDate
          ? p.dueDate.toDate()
          : new Date(p.dueDate);
        const today = new Date();
        return (
          dueDate.getMonth() === today.getMonth() &&
          dueDate.getFullYear() === today.getFullYear()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0),
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  const formatDate = (date) => {
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusInfo = (payment) => {
    if (payment.status === "paid") {
      return {
        text: "Pagado",
        color: "bg-green-100 text-green-800",
        icon: "✅",
      };
    }

    const today = new Date();
    const dueDate = payment.dueDate?.toDate
      ? payment.dueDate.toDate()
      : new Date(payment.dueDate);

    if (dueDate < today) {
      return { text: "Vencido", color: "bg-red-100 text-red-800", icon: "🚨" };
    }

    const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) {
      return {
        text: `${daysDiff} días`,
        color: "bg-yellow-100 text-yellow-800",
        icon: "⚠️",
      };
    }

    return {
      text: "Pendiente",
      color: "bg-blue-100 text-blue-800",
      icon: "📅",
    };
  };

  const getCategoryInfo = (category) => {
    const categories = {
      servicios: { label: "🔌 Servicios", color: "bg-blue-100 text-blue-800" },
      prestamos: { label: "🏦 Préstamos", color: "bg-red-100 text-red-800" },
      tarjetas: {
        label: "💳 Tarjetas",
        color: "bg-purple-100 text-purple-800",
      },
      vivienda: { label: "🏠 Vivienda", color: "bg-green-100 text-green-800" },
      seguros: { label: "🛡️ Seguros", color: "bg-yellow-100 text-yellow-800" },
      otros: { label: "📦 Otros", color: "bg-gray-100 text-gray-800" },
    };
    return categories[category] || categories.otros;
  };

  // Filtrar pagos
  const filteredPayments = payments
    .filter((payment) => {
      // Filtro por estado
      if (filter === "paid" && payment.status !== "paid") return false;
      if (filter === "pending" && payment.status === "paid") return false;
      if (filter === "overdue") {
        const today = new Date();
        const dueDate = payment.dueDate?.toDate
          ? payment.dueDate.toDate()
          : new Date(payment.dueDate);
        if (payment.status === "paid" || dueDate >= today) return false;
      }
      if (filter === "debts" && !payment.isDebt) return false;

      // Filtro por búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          payment.title.toLowerCase().includes(searchLower) ||
          payment.description?.toLowerCase().includes(searchLower) ||
          payment.provider?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Ordenar por fecha de vencimiento
      const dateA = a.dueDate?.toDate
        ? a.dueDate.toDate()
        : new Date(a.dueDate);
      const dateB = b.dueDate?.toDate
        ? b.dueDate.toDate()
        : new Date(b.dueDate);
      return dateA - dateB;
    });

  const filterOptions = [
    { key: "all", label: "Todos", count: payments.length },
    {
      key: "pending",
      label: "Pendientes",
      count: payments.filter((p) => p.status !== "paid").length,
    },
    { key: "overdue", label: "Vencidos", count: stats.overdue },
    {
      key: "paid",
      label: "Pagados",
      count: payments.filter((p) => p.status === "paid").length,
    },
    {
      key: "debts",
      label: "Deudas",
      count: payments.filter((p) => p.isDebt).length,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Finance Organizer
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Hola, {user?.email}</span>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span>Cargando datos...</span>
            </div>
          ) : (
            <>
              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">#</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total de pagos
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.total}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

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
                            Pendientes
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.pending}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">⚠</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Vencidos
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.overdue}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acción rápida para agregar pago */}
              <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Gestión de Pagos
                    </h3>
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                    >
                      <span className="mr-2">+</span>
                      Agregar Pago
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Pagos Integrada */}
              {payments.length > 0 ? (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Mis Pagos ({filteredPayments.length})
                      </h3>
                    </div>

                    {/* Controles de filtro */}
                    <div className="space-y-4 mb-6">
                      {/* Búsqueda */}
                      <div>
                        <input
                          type="text"
                          placeholder="Buscar por título, descripción o proveedor..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Filtros */}
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.map((filterOption) => (
                          <button
                            key={filterOption.key}
                            onClick={() => setFilter(filterOption.key)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                              filter === filterOption.key
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {filterOption.label} ({filterOption.count})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lista de pagos */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {filteredPayments.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-2">🔍</div>
                          <p className="text-gray-600">
                            No se encontraron pagos con los filtros aplicados
                          </p>
                        </div>
                      ) : (
                        filteredPayments.map((payment) => {
                          const statusInfo = getStatusInfo(payment);
                          const categoryInfo = getCategoryInfo(
                            payment.category
                          );

                          return (
                            <div
                              key={payment.id}
                              className={`rounded-lg p-4 border-l-4 transition-all hover:shadow-md ${
                                payment.isDebt
                                  ? "bg-red-50 border-red-400"
                                  : "bg-gray-50 border-blue-400"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {payment.title}
                                    </h4>
                                    {payment.isDebt && (
                                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                        🏦 Deuda
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                                    >
                                      {statusInfo.icon} {statusInfo.text}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}
                                    >
                                      {categoryInfo.label}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">
                                        Monto:
                                      </span>
                                      <p className="font-semibold">
                                        {formatCurrency(payment.amount)}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">
                                        Vence:
                                      </span>
                                      <p className="font-medium">
                                        {formatDate(payment.dueDate)}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">
                                        Proveedor:
                                      </span>
                                      <p className="font-medium">
                                        {payment.provider || "Sin especificar"}
                                      </p>
                                    </div>
                                  </div>

                                  {payment.description && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <p className="text-sm text-gray-600">
                                        {payment.description}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-2 ml-4">
                                  {payment.status !== "paid" && (
                                    <button
                                      onClick={() => handleMarkAsPaid(payment)}
                                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                      title="Procesar pago"
                                    >
                                      💰
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
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Estado vacío */
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💳</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    ¡Bienvenido a Finance Organizer!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza agregando tu primer pago o deuda para tomar control
                    de tus finanzas.
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

export default Dashboard;

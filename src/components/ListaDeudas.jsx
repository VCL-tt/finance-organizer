// src/components/ListaDeudas.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPayments, deletePayment, markPaymentAsPaid } from '../services/paymentsService';

function ListaDeudas({ onEditarDeuda }) {
  const { user } = useAuth();
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas'); // todas, pendientes, vencidas, pagadas
  const [ordenar, setOrdenar] = useState('fecha'); // fecha, monto, prioridad

  useEffect(() => {
    cargarDeudas();
  }, [user]);

  const cargarDeudas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const deudasData = await getPayments(user.uid);
      setDeudas(deudasData);
    } catch (error) {
      console.error('Error al cargar deudas:', error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarDeuda = async (deudaId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta deuda?')) return;
    
    try {
      await deletePayment(user.uid, deudaId);
      setDeudas(deudas.filter(d => d.id !== deudaId));
    } catch (error) {
      console.error('Error al eliminar deuda:', error);
      alert('Error al eliminar la deuda');
    }
  };

  const marcarComoPagada = async (deudaId) => {
    try {
      await markPaymentAsPaid(user.uid, deudaId);
      cargarDeudas(); // Recargar lista
    } catch (error) {
      console.error('Error al marcar como pagada:', error);
      alert('Error al marcar como pagada');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-PE');
  };

  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto || 0);
  };

  const esVencida = (fechaVencimiento, estado) => {
    if (estado === 'pagado') return false;
    const hoy = new Date();
    const fecha = fechaVencimiento.toDate ? fechaVencimiento.toDate() : new Date(fechaVencimiento);
    return fecha < hoy;
  };

  const diasRestantes = (fechaVencimiento) => {
    const hoy = new Date();
    const fecha = fechaVencimiento.toDate ? fechaVencimiento.toDate() : new Date(fechaVencimiento);
    const diferencia = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  const getCategoriaIcon = (categoria) => {
    const iconos = {
      banco: '🏦',
      tarjeta: '💳',
      personal: '👥',
      servicios: '⚡',
      impuestos: '📋',
      otros: '📝'
    };
    return iconos[categoria] || '📝';
  };

  const getPrioridadColor = (prioridad) => {
    const colores = {
      alta: 'bg-red-100 text-red-800',
      media: 'bg-yellow-100 text-yellow-800',
      baja: 'bg-green-100 text-green-800'
    };
    return colores[prioridad] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoColor = (estado, fechaVencimiento) => {
    if (estado === 'pagado') return 'bg-green-100 text-green-800';
    if (esVencida(fechaVencimiento, estado)) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getEstadoTexto = (estado, fechaVencimiento) => {
    if (estado === 'pagado') return 'Pagado';
    if (esVencida(fechaVencimiento, estado)) return 'Vencido';
    return 'Pendiente';
  };

  const deudasFiltradas = deudas.filter(deuda => {
    if (filtro === 'todas') return true;
    if (filtro === 'pendientes') return deuda.estado === 'pendiente' && !esVencida(deuda.fechaVencimiento, deuda.estado);
    if (filtro === 'vencidas') return esVencida(deuda.fechaVencimiento, deuda.estado);
    if (filtro === 'pagadas') return deuda.estado === 'pagado';
    return true;
  }).sort((a, b) => {
    if (ordenar === 'fecha') {
      const fechaA = a.fechaVencimiento.toDate ? a.fechaVencimiento.toDate() : new Date(a.fechaVencimiento);
      const fechaB = b.fechaVencimiento.toDate ? b.fechaVencimiento.toDate() : new Date(b.fechaVencimiento);
      return fechaA - fechaB;
    }
    if (ordenar === 'monto') return (b.montoTotal || b.montoActual) - (a.montoTotal || a.montoActual);
    if (ordenar === 'prioridad') {
      const prioridades = { alta: 3, media: 2, baja: 1 };
      return prioridades[b.prioridad] - prioridades[a.prioridad];
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-gray-900">Mis Deudas</h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Filtro */}
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="pendientes">Pendientes</option>
              <option value="vencidas">Vencidas</option>
              <option value="pagadas">Pagadas</option>
            </select>

            {/* Ordenar */}
            <select
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fecha">Por fecha</option>
              <option value="monto">Por monto</option>
              <option value="prioridad">Por prioridad</option>
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{deudas.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {deudas.filter(d => d.estado === 'pendiente' && !esVencida(d.fechaVencimiento, d.estado)).length}
            </div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {deudas.filter(d => esVencida(d.fechaVencimiento, d.estado)).length}
            </div>
            <div className="text-sm text-gray-600">Vencidas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {deudas.filter(d => d.estado === 'pagado').length}
            </div>
            <div className="text-sm text-gray-600">Pagadas</div>
          </div>
        </div>
      </div>

      {/* Lista de deudas */}
      {deudasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {filtro === 'todas' ? 'No tienes deudas registradas' : `No hay deudas ${filtro}`}
          </h3>
          <p className="text-gray-600">
            {filtro === 'todas' 
              ? 'Comienza agregando tu primera deuda para llevar un mejor control.'
              : 'Prueba cambiando el filtro para ver otras deudas.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deudasFiltradas.map((deuda) => (
            <div key={deuda.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">
                      {getCategoriaIcon(deuda.categoria)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{deuda.titulo}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(deuda.prioridad)}`}>
                          {deuda.prioridad}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(deuda.estado, deuda.fechaVencimiento)}`}>
                          {getEstadoTexto(deuda.estado, deuda.fechaVencimiento)}
                        </span>
                      </div>
                      
                      {deuda.descripcion && (
                        <p className="text-gray-600 mb-2">{deuda.descripcion}</p>
                      )}
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Monto:</span>
                          <div className="font-medium">{formatearMonto(deuda.montoTotal || deuda.montoActual)}</div>
                          {deuda.incluyeIGV && (
                            <div className="text-xs text-gray-500">Inc. IGV</div>
                          )}
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Vencimiento:</span>
                          <div className="font-medium">{formatearFecha(deuda.fechaVencimiento)}</div>
                          {deuda.estado !== 'pagado' && (
                            <div className={`text-xs ${diasRestantes(deuda.fechaVencimiento) < 0 ? 'text-red-600' : diasRestantes(deuda.fechaVencimiento) <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {diasRestantes(deuda.fechaVencimiento) < 0 
                              ? `Vencido hace ${Math.abs(diasRestantes(deuda.fechaVencimiento))} días`
                              : diasRestantes(deuda.fechaVencimiento) === 0 
                                ? 'Vence hoy'
                                : `${diasRestantes(deuda.fechaVencimiento)} días restantes`
                            }
                          </div>
                        )}
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Entidad:</span>
                          <div className="font-medium">{deuda.entidad?.nombre || 'Sin especificar'}</div>
                          {deuda.entidad?.telefono && (
                            <div className="text-xs text-gray-500">{deuda.entidad.telefono}</div>
                          )}
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Frecuencia:</span>
                          <div className="font-medium">
                            {deuda.esRecurrente ? deuda.frecuencia : 'Única vez'}
                          </div>
                          {deuda.tasaInteres > 0 && (
                            <div className="text-xs text-gray-500">{deuda.tasaInteres}% anual</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {deuda.estado !== 'pagado' && (
                      <button
                        onClick={() => marcarComoPagada(deuda.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Marcar Pagado
                      </button>
                    )}
                    
                    <button
                      onClick={() => onEditarDeuda?.(deuda)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Editar
                    </button>
                    
                    <button
                      onClick={() => eliminarDeuda(deuda.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                
                {/* Barra de progreso para pagos recurrentes */}
                {deuda.cuotas && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progreso de pagos</span>
                      <span>{deuda.cuotas.pagadas || 0} / {deuda.cuotas.total || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((deuda.cuotas.pagadas || 0) / (deuda.cuotas.total || 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ListaDeudas;
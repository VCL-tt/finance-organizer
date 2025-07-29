// src/services/paymentsService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Agregar un nuevo pago
export const addPayment = async (userId, paymentData) => {
  const docRef = await addDoc(collection(db, 'users', userId, 'payments'), {
    ...paymentData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

// Obtener todos los pagos del usuario
export const getPayments = async (userId) => {
  const q = query(
    collection(db, 'users', userId, 'payments'),
    orderBy('dueDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Actualizar un pago
export const updatePayment = async (userId, paymentId, updateData) => {
  const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
  await updateDoc(paymentRef, {
    ...updateData,
    updatedAt: new Date()
  });
};

// Eliminar un pago
export const deletePayment = async (userId, paymentId) => {
  await deleteDoc(doc(db, 'users', userId, 'payments', paymentId));
};

// Marcar pago como completado (método simple - mantener compatibilidad)
export const markPaymentAsPaid = async (userId, paymentId) => {
  const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
  await updateDoc(paymentRef, {
    status: 'paid',
    paidDate: new Date(),
    updatedAt: new Date()
  });
};

// Procesar pago parcial
export const processPartialPayment = async (userId, paymentId, paymentAmount, paymentData) => {
  const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
  
  // Obtener el pago actual para calcular el saldo restante
  const currentPayment = await getDoc(paymentRef);
  const currentData = currentPayment.data();
  
  const remainingAmount = currentData.amount - paymentAmount;
  const paymentHistory = currentData.paymentHistory || [];
  
  // Agregar el pago al historial
  paymentHistory.push({
    id: Date.now().toString(),
    amount: paymentAmount,
    date: paymentData.paymentDate || new Date(),
    method: paymentData.paymentMethod || 'efectivo',
    note: paymentData.note || '',
    createdAt: new Date()
  });

  if (remainingAmount <= 0) {
    // Si no queda saldo, marcar como pagado
    await updateDoc(paymentRef, {
      status: 'paid',
      paidDate: paymentData.paymentDate || new Date(),
      paidAmount: currentData.amount,
      paymentHistory,
      paymentMethod: paymentData.paymentMethod,
      paymentNote: paymentData.note,
      updatedAt: new Date()
    });
  } else {
    // Si queda saldo, actualizar el monto
    await updateDoc(paymentRef, {
      amount: remainingAmount,
      paymentHistory,
      lastPaymentDate: paymentData.paymentDate || new Date(),
      lastPaymentAmount: paymentAmount,
      totalPaid: (currentData.totalPaid || 0) + paymentAmount,
      updatedAt: new Date()
    });
  }
};

// Obtener historial de pagos de un pago específico
export const getPaymentHistory = async (userId, paymentId) => {
  const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
  const paymentDoc = await getDoc(paymentRef);
  
  if (paymentDoc.exists()) {
    const data = paymentDoc.data();
    return data.paymentHistory || [];
  }
  
  return [];
};

// Obtener pagos por estado
export const getPaymentsByStatus = async (userId, status) => {
  const q = query(
    collection(db, 'users', userId, 'payments'),
    where('status', '==', status),
    orderBy('dueDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Obtener pagos vencidos
export const getOverduePayments = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, 'users', userId, 'payments'),
    where('status', '!=', 'paid'),
    where('dueDate', '<', today),
    orderBy('status'),
    orderBy('dueDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Obtener pagos del mes actual
export const getCurrentMonthPayments = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const q = query(
    collection(db, 'users', userId, 'payments'),
    where('dueDate', '>=', startOfMonth),
    where('dueDate', '<=', endOfMonth),
    orderBy('dueDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Obtener próximos pagos (próximos N días)
export const getUpcomingPayments = async (userId, days = 7) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  const q = query(
    collection(db, 'users', userId, 'payments'),
    where('status', '!=', 'paid'),
    where('dueDate', '>=', today),
    where('dueDate', '<=', futureDate),
    orderBy('status'),
    orderBy('dueDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Obtener estadísticas de pagos
export const getPaymentStats = async (userId) => {
  const payments = await getPayments(userId);
  const today = new Date();
  
  const stats = {
    total: payments.length,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    monthlyTotal: 0,
    debts: 0,
    debtsAmount: 0
  };
  
  payments.forEach(payment => {
    const dueDate = payment.dueDate?.toDate ? payment.dueDate.toDate() : new Date(payment.dueDate);
    const isCurrentMonth = dueDate.getMonth() === today.getMonth() && 
                          dueDate.getFullYear() === today.getFullYear();
    
    stats.totalAmount += payment.amount;
    
    if (isCurrentMonth) {
      stats.monthlyTotal += payment.amount;
    }
    
    if (payment.isDebt) {
      stats.debts++;
      stats.debtsAmount += payment.amount;
    }
    
    if (payment.status === 'paid') {
      stats.paid++;
      stats.paidAmount += payment.originalAmount || payment.amount;
    } else {
      stats.pending++;
      stats.pendingAmount += payment.amount;
      
      if (dueDate < today) {
        stats.overdue++;
        stats.overdueAmount += payment.amount;
      }
    }
  });
  
  return stats;
};

// Crear pagos recurrentes automáticamente
export const createRecurringPayments = async (userId, basePayment, months = 1) => {
  const recurringPayments = [];
  
  for (let i = 1; i <= months; i++) {
    const nextDueDate = new Date(basePayment.dueDate);
    
    // Calcular la siguiente fecha según el tipo de recurrencia
    switch (basePayment.recurringType) {
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + (7 * i));
        break;
      case 'biweekly':
        nextDueDate.setDate(nextDueDate.getDate() + (14 * i));
        break;
      case 'monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + i);
        break;
      case 'quarterly':
        nextDueDate.setMonth(nextDueDate.getMonth() + (3 * i));
        break;
      case 'semiannual':
        nextDueDate.setMonth(nextDueDate.getMonth() + (6 * i));
        break;
      case 'yearly':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + i);
        break;
      default:
        nextDueDate.setMonth(nextDueDate.getMonth() + i);
    }
    
    const newPayment = {
      ...basePayment,
      dueDate: nextDueDate,
      status: 'pending',
      title: `${basePayment.title} - ${nextDueDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      parentPaymentId: basePayment.id,
      isRecurringInstance: true
    };
    
    delete newPayment.id;
    delete newPayment.createdAt;
    delete newPayment.updatedAt;
    
    const paymentId = await addPayment(userId, newPayment);
    recurringPayments.push({ ...newPayment, id: paymentId });
  }
  
  return recurringPayments;
};

// Importar desde la función que faltaba
import { getDoc } from 'firebase/firestore';
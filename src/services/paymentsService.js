// src/services/paymentsService.js - VERSIÓN LIMPIA
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  getDoc
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

// Marcar pago como completado - SIMPLIFICADO
export const markPaymentAsPaid = async (userId, paymentId) => {
  const paymentRef = doc(db, 'users', userId, 'payments', paymentId);
  await updateDoc(paymentRef, {
    status: 'paid',
    paidDate: new Date(),
    updatedAt: new Date()
  });
};
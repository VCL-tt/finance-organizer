import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDqiWUlJuDmUXlRAgew58xjbWnIE2sKW9k",
  authDomain: "finance-organizer-619a6.firebaseapp.com",
  projectId: "finance-organizer-619a6",
  storageBucket: "finance-organizer-619a6.firebasestorage.app",
  messagingSenderId: "605688945891",
  appId: "1:605688945891:web:1acc923f915775526bb9d6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 
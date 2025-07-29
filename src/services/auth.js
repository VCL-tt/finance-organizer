// src/services/auth.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from './firebaseConfig';

// Registrar usuario con email/contraseña
export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Iniciar sesión con email/contraseña
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Iniciar sesión con Google (con fallback)
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  
  // Configurar el proveedor
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    // Intentar con popup primero
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error con popup:', error.code);
    
    // Si el popup falla, intentar con redirect
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      throw new Error('popup-blocked');
    }
    
    // Para otros errores, relanzar
    throw error;
  }
};

// Alternativa con redirect (para casos donde popup no funciona)
export const loginWithGoogleRedirect = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  
  await signInWithRedirect(auth, provider);
};

// Obtener resultado del redirect
export const getGoogleRedirectResult = async () => {
  return await getRedirectResult(auth);
};

// Cerrar sesión
export const logoutUser = async () => {
  await signOut(auth);
};

// Observar cambios en el estado de autenticación
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
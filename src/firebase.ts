// Facade: switches between real Firebase and localStorage mock based on env vars.
// If VITE_FIREBASE_API_KEY is set at build time, use the real backend; otherwise
// fall back to the in-browser mock (useful for local demos without credentials).
//
// Domain modules import from here, so swapping backends never requires touching
// business-logic code.

import * as mock from './mockFirebase';
import * as real from './realFirebase';

const USE_REAL = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

export const BACKEND_MODE: 'real' | 'mock' = USE_REAL ? 'real' : 'mock';

const impl = USE_REAL ? real : mock;

// eslint-disable-next-line no-console
console.log(`[horse-ee] backend: ${BACKEND_MODE}`);

export const addDoc = impl.addDoc;
export const setDoc = impl.setDoc;
export const getDoc = impl.getDoc;
export const getDocs = impl.getDocs;
export const updateDoc = impl.updateDoc;
export const deleteDoc = impl.deleteDoc;
export const onSnapshot = impl.onSnapshot;

export const currentUser = impl.currentUser;
export const onAuthChanged = impl.onAuthChanged;
export const signInWithEmail = impl.signInWithEmail;
export const signUp = impl.signUp;
export const signInWithGoogle = impl.signInWithGoogle;
export const signOut = impl.signOut;
export const grantRole = impl.grantRole;
export const sendPasswordReset = impl.sendPasswordReset;
export const updateDisplayName = impl.updateDisplayName;

export type { MockUser } from './mockFirebase';

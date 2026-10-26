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

// Firestore rejects `undefined` values. We strip them before any write so that
// consumers can pass optional fields without having to filter manually.
function clean<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((v) => clean(v)) as any;
  if (typeof input === 'object' && !(input instanceof Date)) {
    const out: any = {};
    for (const k of Object.keys(input as any)) {
      const v = (input as any)[k];
      if (v === undefined) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return input;
}

export const addDoc: typeof impl.addDoc = (path, data) => impl.addDoc(path, clean(data));
export const setDoc: typeof impl.setDoc = (path, data) => impl.setDoc(path, clean(data));
export const updateDoc: typeof impl.updateDoc = (path, patch) => impl.updateDoc(path, clean(patch));

export const getDoc = impl.getDoc;
export const getDocs = impl.getDocs;
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

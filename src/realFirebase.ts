// Real Firebase implementation. Mirrors the API shape of mockFirebase.ts
// so domain/* code can import from a single ./firebase facade.

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore, Firestore,
  doc as fsDoc,
  collection as fsCollection,
  getDoc as fsGetDoc,
  getDocs as fsGetDocs,
  setDoc as fsSetDoc,
  addDoc as fsAddDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  onSnapshot as fsOnSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth, Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FbUser,
} from 'firebase/auth';

export type MockUser = {
  uid: string;
  email: string;
  displayName: string;
  provider: 'password' | 'google';
  roles: { organizer: boolean; admin: boolean };
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function initFirebase() {
  if (app) return { app, db: db!, auth: auth! };
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  app = initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);
  return { app, db, auth };
}

function requireDb(): Firestore {
  if (!db) initFirebase();
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

function requireAuth(): Auth {
  if (!auth) initFirebase();
  if (!auth) throw new Error('Auth not initialized');
  return auth;
}

// ---- Firestore helpers (mirror mockFirebase.ts API) ----

export async function addDoc<T>(collectionPath: string, data: T): Promise<string> {
  const ref = await fsAddDoc(fsCollection(requireDb(), collectionPath), data as any);
  return ref.id;
}

export async function setDoc<T>(docPath: string, data: T): Promise<void> {
  await fsSetDoc(fsDoc(requireDb(), docPath), data as any);
}

export async function getDoc<T>(docPath: string): Promise<T | null> {
  const snap = await fsGetDoc(fsDoc(requireDb(), docPath));
  return snap.exists() ? (snap.data() as T) : null;
}

export async function getDocs<T>(collectionPath: string): Promise<{ id: string; data: T }[]> {
  const snap = await fsGetDocs(fsCollection(requireDb(), collectionPath));
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as T }));
}

export async function updateDoc<T>(docPath: string, patch: Partial<T>): Promise<void> {
  await fsUpdateDoc(fsDoc(requireDb(), docPath), patch as any);
}

export async function deleteDoc(docPath: string): Promise<void> {
  // Firestore does not auto-delete subcollection docs. For now, delete just the
  // target doc; sub-collection cleanup must happen via Cloud Functions.
  await fsDeleteDoc(fsDoc(requireDb(), docPath));
}

export function onSnapshot<T>(collectionPath: string, cb: (docs: { id: string; data: T }[]) => void): () => void {
  return fsOnSnapshot(fsCollection(requireDb(), collectionPath), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, data: d.data() as T })));
  });
}

// ---- Auth helpers (mirror mockFirebase.ts API) ----

let currentUserCache: MockUser | null = null;
const authListeners = new Set<(user: MockUser | null) => void>();

// Track in-flight writes initiated by signUp/signInWithGoogle so onAuthStateChanged
// doesn't race against them and overwrite the role.
const inFlightUserWrites = new Set<string>();

async function toMockUser(u: FbUser): Promise<MockUser> {
  // If signUp/signInWithGoogle is mid-write for this uid, don't touch Firestore —
  // return a provisional MockUser; the write flow will update currentUserCache.
  if (inFlightUserWrites.has(u.uid)) {
    return {
      uid: u.uid,
      email: u.email ?? '',
      displayName: u.displayName ?? (u.email?.split('@')[0] ?? 'kasutaja'),
      provider: u.providerData.some((p) => p.providerId === 'google.com') ? 'google' : 'password',
      roles: { organizer: false, admin: false },
    };
  }
  const existing = await getDoc<MockUser>(`users/${u.uid}`);
  if (existing) {
    return {
      uid: u.uid,
      email: existing.email ?? u.email ?? '',
      displayName: existing.displayName ?? u.displayName ?? 'kasutaja',
      provider: existing.provider ?? 'password',
      roles: existing.roles ?? { organizer: false, admin: false },
    };
  }
  // No doc yet; create with safe defaults.
  const user: MockUser = {
    uid: u.uid,
    email: u.email ?? '',
    displayName: u.displayName ?? (u.email?.split('@')[0] ?? 'kasutaja'),
    provider: u.providerData.some((p) => p.providerId === 'google.com') ? 'google' : 'password',
    roles: { organizer: false, admin: false },
  };
  await setDoc(`users/${u.uid}`, { ...user, createdAt: Date.now() });
  return user;
}

let authPrimed = false;
function primeAuthListener() {
  if (authPrimed) return;
  authPrimed = true;
  onAuthStateChanged(requireAuth(), async (u) => {
    if (u) {
      currentUserCache = await toMockUser(u);
    } else {
      currentUserCache = null;
    }
    authListeners.forEach((cb) => cb(currentUserCache));
  });
}

export function currentUser(): MockUser | null {
  return currentUserCache;
}

export function onAuthChanged(cb: (user: MockUser | null) => void): () => void {
  primeAuthListener();
  cb(currentUserCache);
  authListeners.add(cb);
  return () => { authListeners.delete(cb); };
}

export async function signUp(email: string, password: string, role: 'trainer' | 'rider'): Promise<MockUser> {
  const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
  const uid = cred.user.uid;
  // Guard against the onAuthStateChanged listener creating a default user doc
  // while we're writing the role-tagged doc.
  inFlightUserWrites.add(uid);
  try {
    const u: MockUser = {
      uid,
      email,
      displayName: email.split('@')[0],
      provider: 'password',
      roles: { organizer: role === 'trainer', admin: false },
    };
    await setDoc(`users/${uid}`, { ...u, createdAt: Date.now() });
    currentUserCache = u;
    authListeners.forEach((cb) => cb(u));
    return u;
  } finally {
    inFlightUserWrites.delete(uid);
  }
}

export async function signInWithEmail(email: string, password: string): Promise<MockUser> {
  // Try sign-in; if user does not exist, create account.
  try {
    const cred = await signInWithEmailAndPassword(requireAuth(), email, password);
    return await toMockUser(cred.user);
  } catch (e: any) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
      const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
      return await toMockUser(cred.user);
    }
    throw e;
  }
}

export async function signInWithGoogle(): Promise<MockUser> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(requireAuth(), provider);
  return await toMockUser(cred.user);
}

export async function signOut(): Promise<void> {
  await fbSignOut(requireAuth());
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(requireAuth(), email);
}

export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const auth = requireAuth();
  if (auth.currentUser && auth.currentUser.uid === uid) {
    await updateProfile(auth.currentUser, { displayName });
  }
  await updateDoc<MockUser>(`users/${uid}`, { displayName });
  if (currentUserCache?.uid === uid) {
    currentUserCache = { ...currentUserCache, displayName };
    authListeners.forEach((cb) => cb(currentUserCache));
  }
}

export async function grantRole(uid: string, role: 'organizer' | 'admin', value: boolean): Promise<void> {
  const u = await getDoc<MockUser>(`users/${uid}`);
  if (!u) throw new Error('user not found');
  const nextRoles = { ...u.roles, [role]: value };
  await updateDoc<MockUser>(`users/${uid}`, { roles: nextRoles });
  if (currentUserCache?.uid === uid) {
    currentUserCache = { ...currentUserCache, roles: nextRoles };
    authListeners.forEach((cb) => cb(currentUserCache));
  }
}

// Expose server timestamp sentinel for future use.
export { serverTimestamp };

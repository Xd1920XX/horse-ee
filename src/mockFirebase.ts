// Mock Firestore + Auth that mirrors the shape of the real SDK closely enough
// that swapping to firebase/firestore + firebase/auth later is mechanical.
// Data persists in localStorage. All ops are async for parity with real SDK.

type Listener<T> = (docs: { id: string; data: T }[]) => void;

const STORE_KEY = 'mock-firestore';
const AUTH_KEY = 'mock-firebase-auth';

type Store = Record<string, any>;

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(s: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  notifyAll();
}

const uid = () => Math.random().toString(36).slice(2, 12);

// Collection listeners keyed by collection path prefix.
const listeners = new Map<string, Set<Listener<any>>>();

function notifyAll() {
  for (const [path, set] of listeners) {
    const docs = listDocsSync(path);
    set.forEach((cb) => cb(docs));
  }
}

function listDocsSync<T>(collectionPath: string): { id: string; data: T }[] {
  const store = loadStore();
  const prefix = collectionPath.endsWith('/') ? collectionPath : collectionPath + '/';
  const out: { id: string; data: T }[] = [];
  for (const key of Object.keys(store)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    if (rest.includes('/')) continue; // skip sub-collection docs
    out.push({ id: rest, data: store[key] });
  }
  return out;
}

export async function addDoc<T>(collectionPath: string, data: T): Promise<string> {
  const id = uid();
  const store = loadStore();
  store[`${collectionPath}/${id}`] = data;
  saveStore(store);
  return id;
}

export async function setDoc<T>(docPath: string, data: T): Promise<void> {
  const store = loadStore();
  store[docPath] = data;
  saveStore(store);
}

export async function getDoc<T>(docPath: string): Promise<T | null> {
  const store = loadStore();
  return (store[docPath] as T) ?? null;
}

export async function getDocs<T>(collectionPath: string): Promise<{ id: string; data: T }[]> {
  return listDocsSync<T>(collectionPath);
}

export async function updateDoc<T>(docPath: string, patch: Partial<T>): Promise<void> {
  const store = loadStore();
  if (!store[docPath]) throw new Error(`doc not found: ${docPath}`);
  store[docPath] = { ...store[docPath], ...patch };
  saveStore(store);
}

export async function deleteDoc(docPath: string): Promise<void> {
  const store = loadStore();
  delete store[docPath];
  // Also delete sub-collection docs
  for (const k of Object.keys(store)) if (k.startsWith(docPath + '/')) delete store[k];
  saveStore(store);
}

export function onSnapshot<T>(collectionPath: string, cb: Listener<T>): () => void {
  cb(listDocsSync<T>(collectionPath));
  const set = listeners.get(collectionPath) ?? new Set();
  set.add(cb);
  listeners.set(collectionPath, set);
  return () => {
    set.delete(cb);
    if (!set.size) listeners.delete(collectionPath);
  };
}

// ----- Auth -----

export type MockUser = {
  uid: string;
  email: string;
  displayName: string;
  provider: 'password' | 'google';
  roles: { organizer: boolean; admin: boolean };
};

type AuthListener = (user: MockUser | null) => void;
const authListeners = new Set<AuthListener>();

function loadUser(): MockUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(u: MockUser | null) {
  if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
  else localStorage.removeItem(AUTH_KEY);
  authListeners.forEach((cb) => cb(u));
}

export function currentUser(): MockUser | null {
  return loadUser();
}

export function onAuthChanged(cb: AuthListener): () => void {
  cb(loadUser());
  authListeners.add(cb);
  return () => authListeners.delete(cb);
}

async function upsertUserDoc(u: MockUser) {
  const existing = await getDoc<MockUser>(`users/${u.uid}`);
  const merged = { ...u, roles: existing?.roles ?? u.roles };
  await setDoc(`users/${u.uid}`, merged);
  return merged;
}

export async function signUp(email: string, _password: string, role: 'trainer' | 'rider'): Promise<MockUser> {
  const uidStr = 'u_' + btoa(email).replace(/[^a-z0-9]/gi, '').slice(0, 10);
  const u: MockUser = {
    uid: uidStr,
    email,
    displayName: email.split('@')[0],
    provider: 'password',
    roles: { organizer: role === 'trainer', admin: false },
  };
  await setDoc(`users/${uidStr}`, u);
  saveUser(u);
  return u;
}

export async function signInWithEmail(email: string, _password: string): Promise<MockUser> {
  // Mock: any password works, uid derived from email so repeated logins are stable.
  const uidStr = 'u_' + btoa(email).replace(/[^a-z0-9]/gi, '').slice(0, 10);
  const u: MockUser = {
    uid: uidStr,
    email,
    displayName: email.split('@')[0],
    provider: 'password',
    roles: { organizer: false, admin: false },
  };
  const merged = await upsertUserDoc(u);
  saveUser(merged);
  return merged;
}

export async function signInWithGoogle(): Promise<MockUser> {
  // Mock Google sign-in — in real SDK this triggers OAuth popup.
  // Here we fake a Google account using a stable uid from the browser.
  let fingerprint = localStorage.getItem('mock-google-fp');
  if (!fingerprint) {
    fingerprint = Math.random().toString(36).slice(2, 10);
    localStorage.setItem('mock-google-fp', fingerprint);
  }
  const email = `kasutaja.${fingerprint}@gmail.com`;
  const u: MockUser = {
    uid: 'g_' + fingerprint,
    email,
    displayName: 'Google kasutaja',
    provider: 'google',
    roles: { organizer: false, admin: false },
  };
  const merged = await upsertUserDoc(u);
  saveUser(merged);
  return merged;
}

export async function signOut(): Promise<void> {
  saveUser(null);
}

export async function sendPasswordReset(_email: string): Promise<void> {
  // Mock: no-op. Real Firebase sends email with reset link.
  await new Promise((r) => setTimeout(r, 200));
}

export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const u = await getDoc<MockUser>(`users/${uid}`);
  if (!u) throw new Error('user not found');
  await updateDoc<MockUser>(`users/${uid}`, { displayName });
  const cur = loadUser();
  if (cur?.uid === uid) saveUser({ ...u, displayName });
}

export async function grantRole(uid: string, role: 'organizer' | 'admin', value: boolean): Promise<void> {
  const u = await getDoc<MockUser>(`users/${uid}`);
  if (!u) throw new Error('user not found');
  const nextRoles = { ...u.roles, [role]: value };
  await updateDoc<MockUser>(`users/${uid}`, { roles: nextRoles });
  const cur = loadUser();
  if (cur?.uid === uid) saveUser({ ...u, roles: nextRoles });
}

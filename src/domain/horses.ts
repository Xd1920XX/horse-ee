import { addDoc, deleteDoc, getDoc, getDocs, onSnapshot, updateDoc } from '../firebase';
import { Horse } from './types';

const COL = 'horses';

export async function listHorses(ownerUid?: string): Promise<Horse[]> {
  const docs = await getDocs<Horse>(COL);
  const all = docs.map((d) => ({ ...d.data, id: d.id }));
  return ownerUid ? all.filter((h) => h.ownerUid === ownerUid) : all;
}

export function watchHorsesByOwner(ownerUid: string, cb: (hs: Horse[]) => void): () => void {
  return onSnapshot<Horse>(COL, (docs) => {
    cb(docs.map((d) => ({ ...d.data, id: d.id })).filter((h) => h.ownerUid === ownerUid));
  });
}

export async function getHorse(id: string): Promise<Horse | null> {
  const d = await getDoc<Horse>(`${COL}/${id}`);
  return d ? { ...d, id } : null;
}

export async function createHorse(h: Omit<Horse, 'id'>): Promise<string> {
  return await addDoc(COL, h);
}

export async function updateHorse(id: string, patch: Partial<Horse>): Promise<void> {
  await updateDoc<Horse>(`${COL}/${id}`, patch);
}

export async function deleteHorse(id: string): Promise<void> {
  await deleteDoc(`${COL}/${id}`);
}

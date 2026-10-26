import { addDoc, deleteDoc, getDocs, onSnapshot, updateDoc } from '../firebase';
import { Registration } from './types';

const sub = (compId: string) => `competitions/${compId}/registrations`;

export async function listRegistrations(compId: string): Promise<Registration[]> {
  const docs = await getDocs<Registration>(sub(compId));
  return docs.map((d) => ({ ...d.data, id: d.id }));
}

export function watchRegistrations(compId: string, cb: (rs: Registration[]) => void): () => void {
  return onSnapshot<Registration>(sub(compId), (docs) => {
    cb(docs.map((d) => ({ ...d.data, id: d.id })));
  });
}

export async function listRegistrationsForRider(compId: string, riderUid: string): Promise<Registration[]> {
  const all = await listRegistrations(compId);
  return all.filter((r) => r.riderUid === riderUid);
}

export async function createRegistration(compId: string, r: Omit<Registration, 'id' | 'createdAt'>): Promise<string> {
  const full: Registration = { ...r, id: '', createdAt: Date.now() };
  const id = await addDoc(sub(compId), full);
  await updateDoc<Registration>(`${sub(compId)}/${id}`, { id });
  return id;
}

export async function updateRegistration(compId: string, id: string, patch: Partial<Registration>): Promise<void> {
  await updateDoc<Registration>(`${sub(compId)}/${id}`, patch);
}

export async function deleteRegistration(compId: string, id: string): Promise<void> {
  await deleteDoc(`${sub(compId)}/${id}`);
}

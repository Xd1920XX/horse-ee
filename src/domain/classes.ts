import { addDoc, deleteDoc, getDocs, onSnapshot, updateDoc } from '../firebase';
import { CompetitionClass } from './types';

const sub = (compId: string) => `competitions/${compId}/classes`;

export async function listClasses(compId: string): Promise<CompetitionClass[]> {
  const docs = await getDocs<CompetitionClass>(sub(compId));
  return docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function watchClasses(compId: string, cb: (cs: CompetitionClass[]) => void): () => void {
  return onSnapshot<CompetitionClass>(sub(compId), (docs) => {
    cb(docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.orderIndex - b.orderIndex));
  });
}

export async function createClass(compId: string, cl: Omit<CompetitionClass, 'id'>): Promise<string> {
  // Firestore auto-generates the doc id. We write without an id field; callers
  // read it back via docs returned from list/watch (which include the id).
  const id = await addDoc(sub(compId), cl);
  return id;
}

export async function updateClass(compId: string, id: string, patch: Partial<CompetitionClass>): Promise<void> {
  await updateDoc<CompetitionClass>(`${sub(compId)}/${id}`, patch);
}

export async function deleteClass(compId: string, id: string): Promise<void> {
  await deleteDoc(`${sub(compId)}/${id}`);
}

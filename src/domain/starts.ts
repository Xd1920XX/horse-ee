import { addDoc, deleteDoc, getDocs, onSnapshot, updateDoc } from '../firebase';
import { StartEntry, Registration } from './types';

const sub = (compId: string) => `competitions/${compId}/starts`;

export async function listStarts(compId: string): Promise<StartEntry[]> {
  const docs = await getDocs<StartEntry>(sub(compId));
  return docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.startNumber - b.startNumber);
}

export function watchStarts(compId: string, cb: (s: StartEntry[]) => void): () => void {
  return onSnapshot<StartEntry>(sub(compId), (docs) => {
    cb(docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.startNumber - b.startNumber));
  });
}

export async function createStart(compId: string, s: Omit<StartEntry, 'id'>): Promise<string> {
  const id = await addDoc(sub(compId), { ...s, id: '' });
  await updateDoc<StartEntry>(`${sub(compId)}/${id}`, { id });
  return id;
}

export async function updateStart(compId: string, id: string, patch: Partial<StartEntry>): Promise<void> {
  await updateDoc<StartEntry>(`${sub(compId)}/${id}`, patch);
}

export async function deleteStart(compId: string, id: string): Promise<void> {
  await deleteDoc(`${sub(compId)}/${id}`);
}

// Generate startlist for a class: assign start numbers + scheduled times (first + interval).
// Returns created StartEntry docs count.
export async function generateStartList(
  compId: string,
  classId: string,
  confirmed: Registration[],
  firstStartMs: number,
  intervalSeconds: number,
): Promise<number> {
  // Remove existing starts for this class first.
  const existing = await listStarts(compId);
  for (const s of existing.filter((e) => e.classId === classId)) {
    await deleteStart(compId, s.id);
  }

  // Shuffle so riders can't predict order (simple Fisher-Yates with Math.random)
  const order = [...confirmed];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  for (let i = 0; i < order.length; i++) {
    const r = order[i];
    await createStart(compId, {
      classId,
      registrationId: r.id,
      startNumber: i + 1,
      startTimeScheduled: firstStartMs + i * intervalSeconds * 1000,
      result: { faults: null, timeSeconds: null, eliminated: false, withdrew: false },
    });
  }
  return order.length;
}

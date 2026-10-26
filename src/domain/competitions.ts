import { addDoc, deleteDoc, getDoc, getDocs, onSnapshot, updateDoc } from '../firebase';
import { Competition, CompetitionClass, Registration, StartEntry } from './types';

const COL = 'competitions';

export async function listCompetitions(): Promise<Competition[]> {
  const docs = await getDocs<Competition>(COL);
  return docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.date - b.date);
}

export function watchCompetitions(cb: (c: Competition[]) => void): () => void {
  return onSnapshot<Competition>(COL, (docs) => {
    cb(docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.date - b.date));
  });
}

export async function getCompetition(id: string): Promise<Competition | null> {
  const doc = await getDoc<Competition>(`${COL}/${id}`);
  return doc ? { ...doc, id } : null;
}

export async function createCompetition(c: Omit<Competition, 'id' | 'createdAt'>): Promise<string> {
  const id = await addDoc(COL, { ...c, createdAt: Date.now() });
  return id;
}

export async function updateCompetition(id: string, patch: Partial<Competition>): Promise<void> {
  await updateDoc<Competition>(`${COL}/${id}`, patch);
}

export async function deleteCompetition(id: string): Promise<void> {
  await deleteDoc(`${COL}/${id}`);
}

// ---- Classes ----

export async function listClasses(competitionId: string): Promise<CompetitionClass[]> {
  const docs = await getDocs<CompetitionClass>(`${COL}/${competitionId}/classes`);
  return docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function watchClasses(competitionId: string, cb: (cs: CompetitionClass[]) => void): () => void {
  return onSnapshot<CompetitionClass>(`${COL}/${competitionId}/classes`, (docs) => {
    cb(docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.orderIndex - b.orderIndex));
  });
}

export async function createClass(competitionId: string, cl: Omit<CompetitionClass, 'id'>): Promise<string> {
  return await addDoc(`${COL}/${competitionId}/classes`, cl);
}

// ---- Registrations ----

export async function listRegistrations(competitionId: string): Promise<Registration[]> {
  const docs = await getDocs<Registration>(`${COL}/${competitionId}/registrations`);
  return docs.map((d) => ({ ...d.data, id: d.id }));
}

export async function createRegistration(competitionId: string, r: Omit<Registration, 'id' | 'createdAt'>): Promise<string> {
  return await addDoc(`${COL}/${competitionId}/registrations`, { ...r, createdAt: Date.now() });
}

// ---- Starts ----

export async function listStarts(competitionId: string): Promise<StartEntry[]> {
  const docs = await getDocs<StartEntry>(`${COL}/${competitionId}/starts`);
  return docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.startNumber - b.startNumber);
}

export function watchStarts(competitionId: string, cb: (s: StartEntry[]) => void): () => void {
  return onSnapshot<StartEntry>(`${COL}/${competitionId}/starts`, (docs) => {
    cb(docs.map((d) => ({ ...d.data, id: d.id })).sort((a, b) => a.startNumber - b.startNumber));
  });
}

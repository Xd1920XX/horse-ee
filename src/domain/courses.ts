// Firestore-backed persistence for designer courses.
// Allows linking a Course to a CompetitionClass.

import { addDoc, deleteDoc, getDoc, getDocs, onSnapshot, updateDoc } from '../firebase';
import { Course } from '../types';

const COL = 'courses';

export type CourseMeta = {
  id: string;
  ownerUid: string;
  name: string;
  heightClass: number;
  updatedAt: number;
};

export async function listCourses(ownerUid?: string): Promise<Course[]> {
  const docs = await getDocs<Course & { ownerUid?: string }>(COL);
  const all = docs.map((d) => ({ ...d.data, id: d.id }));
  return (ownerUid ? all.filter((c: any) => c.ownerUid === ownerUid) : all) as Course[];
}

export function watchCoursesByOwner(ownerUid: string, cb: (list: Course[]) => void): () => void {
  return onSnapshot<Course & { ownerUid?: string }>(COL, (docs) => {
    const list = docs.map((d) => ({ ...d.data, id: d.id })).filter((c: any) => c.ownerUid === ownerUid);
    cb(list as Course[]);
  });
}

export async function getCourse(id: string): Promise<Course | null> {
  const d = await getDoc<Course>(`${COL}/${id}`);
  return d ? ({ ...d, id } as Course) : null;
}

export async function saveCourse(ownerUid: string, course: Course): Promise<string> {
  const payload = { ...course, ownerUid, updatedAt: Date.now() };
  if (course.id) {
    // Try update, create if missing
    const existing = await getDoc(`${COL}/${course.id}`);
    if (existing) {
      await updateDoc(`${COL}/${course.id}`, payload);
      return course.id;
    }
  }
  const id = await addDoc(COL, payload);
  await updateDoc(`${COL}/${id}`, { id });
  return id;
}

export async function deleteCourse(id: string): Promise<void> {
  await deleteDoc(`${COL}/${id}`);
}
